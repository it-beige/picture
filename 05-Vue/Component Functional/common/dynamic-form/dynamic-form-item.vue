<template>
  <el-form-item
    :rules="rules"
    :label="label"
    :prop="prop"
  >
    <!-- 自定义label -->
    <template
      v-if="formThis.$scopedSlots[realProp + 'Label']"
      #label
    >
      <slot-content
        v-bind="_attrs"
        :render="formThis.$scopedSlots[realProp + 'Label']"
      />
    </template>

    <!-- 自定义error -->
    <template
      v-if="formThis.$scopedSlots[realProp + 'Error']"
      #error="{error}"
    >
      <slot-content
        v-bind="{..._attrs, error}"
        :render="formThis.$scopedSlots[realProp + 'Error']"
      />
    </template>
    <dynamic-input
      v-if="inputType.includes(type)"
      :type="type"
      v-bind="$attrs"
      v-on="onEvent"
      :placeholder="formatterPlaceHolder"
    />
    <dynamic-select
      v-else-if="selectType.includes(type)"
      v-bind="$attrs"
      v-on="onEvent"
      :placeholder="formatterPlaceHolder"
    />
    <el-date-picker
      v-else-if="dateType.includes(type)"
      v-bind="$attrs"
      v-on="onEvent"
      :placeholder="formatterPlaceHolder"
    />
    <dynamic-upload
      v-else-if="type === 'upload'"
      v-bind="$attrs"
      v-on="onEvent"
    />

    <!-- 自定义表单项 -->
    <slot-content
      v-else-if="isRenderSlot({type, realProp})"
      v-bind="_attrs"
      :render="generateSlotRender(_attrs)"
    />
  </el-form-item>
</template>

<script>

import {
  inputType,
  selectType,
  dateType,
  customType,
} from '../config/form-item.js'

export default {
  name: 'DynamicFormItem',
  inheritAttrs: false,
  inject: {
    formThis: {
      default: {}
    }
  },
  components: {
    DynamicSelect: () => import('../dynamic-select'),
    DynamicInput: () => import('../dynamic-input'),
    DynamicUpload: () => import('../dynamic-upload'),
    'slot-content': {
      props: {
        value: {},
        render: {
          type: Function,
          required: true
        }
      },
      render($createElement) {
        return this.render({
          ...this.$attrs,
          value: this.value,
          $createElement
        })
      }
    }
  },
  props: {
    label: String,
    type: {
      type: String,
      require: true,
      validator: (type) => {
        return [...inputType, ...selectType, ...customType, ...dateType, 'slot']
          .includes(type)
      }
    },
    prop: {
      type: String,
      require: true
    },
    rules: {
      type: [Array, Object]
    },
    placeholder: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      inputType: Object.freeze(inputType),
      selectType: Object.freeze(selectType),
      dateType: Object.freeze(dateType),
      customType: Object.freeze(customType)
    }
  },
  computed: {
    // 传递给外界使用的所有参数
    _attrs({ value, label, rules, realProp, $attrs }) {
      return {
        value,
        label,
        rules,
        realProp,
        ...$attrs
      }
    },
    // 对于深度属性做特殊处理 data.val => dataVal
    realProp({ prop }) {
      return prop.replace(/\.([^.]+)+?/g, (...arg) => {
        const [, execProp] = arg
        return execProp[0].toUpperCase() + execProp.substr(1)
      })
    },
    // 格式化后的placeholder
    formatterPlaceHolder({ placeholder, type, label = '' }) {
      // 如果整个表单项禁用, placeholder不显示
      if (this.formThis.disabled) {
        return ''
      }

      // 使用用户配置的
      if (placeholder) return placeholder
      let {
        inputType,
        selectType,
        dateType,
      } = this

      if (inputType.includes(type)) {
        return `请输入${label}`
      } else if ([...selectType, ...dateType].includes(type)) {
        return `请选择${label}`
      }
    },
    // 整合配置项中的listeners，最终向下透传的事件 
    onEvent({ $listeners, listeners }) {
      // 配置项中的事件优先级大于在dynamic-form中监听的事件
      return { ...$listeners, ...listeners }
    }
  },
  methods: {

    /**
     * @description: 是否渲染自定义内容
     * @param {String} type
     */
    isRenderSlot({ type, realProp }) {
      if (type !== 'slot') {
        return false
      }
      /*
        支持两种渲染方式
          1. template模板的方式
          2. 在配置项中写render函数的方式
      */
      return [
        typeof this.formThis.$scopedSlots[realProp],
        typeof this.$attrs.render
      ].includes('function')
    },
    // 渲染自定内容的render函数 在配置项中写render函数的方式 > template的方式
    generateSlotRender() {
      // normalizeScopedSlot
      return ({ value, $createElement }) => {
        // 给插槽传递参数
        const slotScope = { ...this._attrs, value, $createElement }
        const renderSlot = this._attrs.render || this.formThis.$scopedSlots[this.realProp]
        return renderSlot(slotScope)
      }
    }
  }

}
</script>
