import {Subject} from 'rxjs'
import JlFormItem from './formItem'
import {isEqual} from "~/utils"

export default {
  name: 'JlForm',
  componentName: 'JlForm',
  inheritAttrs: false,
  components: {JlFormItem},
  provide() {
    return {
      jlFormThis: this,
      jlFormSubject: this.jlFormSubject
    };
  },
  props: {
    model: Object,
    disabled: Boolean,
    inline: Boolean,
    hiddenLabel: Boolean,
    labelWidth: {
      type: [String, Number],
      default: '80px'
    },
    // inline 为true时生效
    contentWidth: String,
    options: {
      type: Array,
      default: () => ([])
    },
    // 和options一样
    config: {
      type: Array,
      default: () => ([])
    },
    space: {
      type: Number,
      default: 20
    }
  },
  data() {
    return {
      jlFormSubject: new Subject(),
      cascadeMap: new Map(),
    }
  },
  computed: {
    getOptions({options, config}) {
      if (!options || !options.length) {
        options = config
      }
      const formOptions = [];
      if (options && options.length) {
        options.forEach(i => {
          this.initModelDefaultValue(i);
          if (!i.hidden || (typeof i.hidden === 'function' && !i.hidden(this.model))) {
            if (!i.prop) {
              i.prop = i.key
            }
            formOptions.push(i)
          }
          if (Object.prototype.hasOwnProperty.call(i, 'cascade')) {
            let cascadeField = '';
            if (i.params) {
              Object.keys(i.params).forEach(filed => {
                if (!i.params[filed]) {
                  cascadeField = filed
                }
              })
            }
            const cascadeObj = {prop: i.prop, cascadeField: cascadeField};
            if (this.cascadeMap.has(i.cascade)) {
              const arr = this.cascadeMap.get(i.cascade);
              if (arr.findIndex(itm => itm.prop === i.prop) === -1) {
                arr.push(cascadeObj);
                this.cascadeMap.set(i.cascade, arr)
              }
            } else {
              this.cascadeMap.set(i.cascade, [cascadeObj])
            }
          }
        })
      }
      return formOptions
    },
    getSpace() {
      const space = parseFloat(this.space);
      if (isNaN(space)) {
        return '10px'
      }
      return (space / 2) + 'px'
    }
  },
  created() {
    // 初始化级联选项
    this.$nextTick(() => {
      if (this.cascadeMap.size) {
        this.cascadeMap.forEach((v, k) => {
          const value = this.privateGetModelValue(this.model, k);
          if (value) {
            v.forEach(i => {
              this.jlFormSubject.next({init: true, prop: i.prop, cascadeField: i.cascadeField, value: value})
            })
          }
        })
      }
    })
  },
  mounted() {
    this.$emit('form-mounted', this)
  },
  activated() {
    this.$emit('form-activated', this)
  },
  beforeDestroy() {
    this.cascadeMap.clear();
    this.cascadeMap = null;
    this.jlFormSubject = null
  },
  methods: {
    validate(callback) {
      if (callback) {
        return this.$refs.elForm.validate(callback)
      }
      return new Promise((resolve, reject) => {
        this.$refs.elForm.validate((valid, data) => {
          if (valid) {
            resolve(this.model)
          } else {
            const err = data[Object.keys(data)[0]];
            let msg = '';
            if (err instanceof Array && err.length) {
              msg = err[0].message
            } else if (typeof err === 'object') {
              msg = err.message
            }
            reject(msg)
          }
        }).catch(e => reject(e))
      })
    },
    validateField(props, callback) {
      return this.$refs.elForm.validateField(props, callback)
    },
    clearValidate(props) {
      return this.$refs.elForm.clearValidate(props)
    },
    resetFields() {
      return this.$refs.elForm.resetFields()
    },
    /** 内部方法 */
    privateGetModelValue(model, prop) {
      if (!prop) return;
      if (prop.indexOf('.') !== -1) {
        const paths = prop.split('.');
        let current = model;
        let result = null;
        for (let i = 0, j = paths.length; i < j; i++) {
          const path = paths[i];
          if (!current) break;
          if (i === j - 1) {
            result = current[path];
            break
          }
          current = current[path]
        }
        return result
      } else {
        return model[prop]
      }
    },
    privateSetModelValue(model, prop, value) {
      if (!prop) return;
      if (prop.indexOf('.') !== -1) {
        const paths = prop.split('.');
        const pathsNew = [].concat(paths);
        const targetValue = {};
        for (let j = paths.length - 1, i = j; i >= 0; i--) {
          const path = paths[i];
          // 目标对象赋值
          if (i === j) {
            this.$set(targetValue, path, value);
          } else if (i === 0) {
            // 最后一层级绑定model
            const obj = this.privateGetModelValue(model, path);
            this.$set(model, path,  Object.assign({}, obj, targetValue))
          } else {
            // 更新每一层级的值
            const obj = this.privateGetModelValue(model, pathsNew.join('.'));
            this.$set(targetValue, path, Object.assign({}, obj, targetValue));
            delete targetValue[paths[i + 1]]
          }
          pathsNew.pop();
        }
      } else {
        this.$set(model, prop, value)
      }
    },
    initModelDefaultValue({prop, key, value}) {
      if (!prop) {
        prop = key
      }
      if (value !== null && value !== undefined && (this.model[prop] === undefined || this.model[prop] === null)) {
        this.$set(this.model, prop, value)
      }
      if (prop.indexOf('.') !== -1) {
        const value = this.privateGetModelValue(this.model, prop);
        if (!value) {
          this.privateSetModelValue(this.model, prop, null)
        }
      }
    }
  },
  render(h) {
    const self = this;
    // 渲染formItem
    const formItemVNode = self.getOptions.map(op => {
      return h('jl-form-item', {
        staticClass: op.span ? 'jl-col_' + op.span : 'jl-col_12',
        staticStyle: {paddingLeft: self.getSpace, paddingRight: self.getSpace, '--content-width': op.contentWidth},
        attrs: {
          ...op,
          value: self.privateGetModelValue(self.model, op.prop || op.key),
        },
        on: {
          ...self.$listeners,
          input: (val) => {
            if (!isEqual(val, self.model[op.prop])) {
              if (self.cascadeMap.has(op.prop)) {
                const arr = self.cascadeMap.get(op.prop);
                arr.forEach(i => {
                  if (!i.cascadeField) {
                    // eslint-disable-next-line
                    console.warn(`【${i.prop}】缺失级联查询字段`)
                  } else {
                    self.jlFormSubject.next({prop: i.prop, cascadeField: i.cascadeField, value: val})
                  }
                })
              }
            }
            self.privateSetModelValue(self.model, op.prop || op.key, val);
            self.$emit('input', {...self.model, [op.prop || op.key]: val});
          }
        }
      })
    });
    const defaultSlots = self.$slots.default;
    return h('el-form', {
        class: self.className,
        staticClass: self.inline ? 'jl-grid-container--inline' : 'jl-grid-container',
        style: { ...self.customStyle, '--content-width': self.contentWidth },
        attrs: {
          ...self.$attrs,
        },
        props: {
          model: self.model,
          disabled: self.disabled,
          labelWidth: self.labelWidth,
          inline: self.inline,
          rules: self.disabled ? null : self.$attrs.rules,
          'validate-on-rule-change': !self.disabled
        },
        on: {
          ...self.$listeners
        },
        ref: 'elForm'
      }, self.inline ? [
      h('div', {
        staticClass: 'jl-row',
        staticStyle: {marginLeft: `-${self.getSpace}`, marginRight: `-${self.getSpace}`},
      }, [].concat(formItemVNode, defaultSlots))
      ] : [
        h('div', {
          staticClass: 'jl-row',
          staticStyle: {marginLeft: `-${self.getSpace}`, marginRight: `-${self.getSpace}`},
        }, formItemVNode),
        h('div', {
          staticClass: 'jl-row',
        }, defaultSlots)
      ]
    )
  },
}
