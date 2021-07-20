<script>
// 供全局使用
let h

// 支持的类型
const cascaderType = [
  'el-cascader',
  'el-cascader-panel'
]

// 渲染el-cascader提供的slot
function renderElCascaderSlots($scopedSlots) {
  const slots = Object.keys($scopedSlots).map(slotName => {
    return h('slot-content', {
      props: {
        render: $scopedSlots[slotName]
      },
      slot: slotName,
      key: slotName
    })
  })
  console.log(slots)
  return slots
}

export default {
  name: 'DynamicCascader',
  components: {
    // 懒加载「专门用来渲染el-cascader提供的slot的无状态组件」
    SlotContent: () => import('./slotContent')
  },
  // $attrs中的成员不显示在dom上
  inheritAttrs: false,
  props: {
    // 类型
    type: {
      default: 'el-cascader',
      validator: typeVal => {
        return cascaderType.includes(typeVal)
      }
    },
    /* eslint-disable */
    // 绑定值
    value: {},
    // 备选项
    options: {
      type: Array,
      default: () => []
    },
    // 格式化选项数据
    formatter: Function,

    // 获取备选项的URL(与options互斥)
    optionsUrl: String,
    method: {
      type: String,
      default: 'GET'
    },
    // 解析接口获取的数据
    parseData: Function

    // 支持el-cascader/el-cascader-panel所有参数
  },
  data() {
    return {
      newOptions: this.options
    }
  },
  computed: {
    // 根据method获取params的Key
    paramsObj({getParamsObjByMethod, method, $attrs}) {
      return getParamsObjByMethod({
        method,
        ...$attrs
      })
    },
    // 只要这三个参数有一个变动，就会触发重新计算
    requestOption({ optionsUrl, paramsObj }) {
      return {
        url: optionsUrl,
        ...paramsObj
      }
    },
  },
  watch: {
    requestOption: {
      async handler(requestOption) {
        if (!requestOption.url) return
        this.newOptions = await this.getAsyncOptions({
          requestOption,
          parseData: this.parseData
        })
      },
    },
  },
  methods: {
    // 获取异步数据的参数
    getParamsObjByMethod({method, data, params}) {
      return method.toUpperCase() === 'GET' 
      ? {
        method: 'GET',
        params,
      } 
      : {
        method: 'POST',
        data,
      } 
    },
   
    // 异步获取数据
    async getAsyncOptions({requestOption, parseData}) {
      let request
      if (this.$http) {
        request = this.$http
      }
      // 动态加载axios
      const options = await import('@/utils/request')
        .then(module => {
          request = module.default
          return request(requestOption)
        })
        .then(res => {
          return parseData && parseData(res) ||
          res.pageData ||
          res.data
        })
        .catch(err => {
          console.error(err)
        })
      return options || []
    },

  },
  render() {
    h = this.$createElement
    const {
      refName,
      $slots,
      $scopedSlots,
      type,
      newOptions,
    } = this

    let cascaderVNode = h(type, {
      props: {
        value: this.newValue,
        options: newOptions,
        ...this.$attrs
      },
      on: {
        ...this.$listeners
      },
      scopedSlots: {
        default(props) {
          if ($scopedSlots.default) {
            console.log(props);
            return $scopedSlots.default(props)
          }
        }
      },
      ref: refName || 'el-cascader'
    })

    return cascaderVNode
  }
}
</script>

