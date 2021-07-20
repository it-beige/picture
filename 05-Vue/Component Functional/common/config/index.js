import { addComponent } from '../componentsType'
const globalConfig = {
  // 请求baseURL VUE_APP_BASE_API
  baseURI: '',
  // 请求头
  requestHeaders: {},
  // 是否开启缓存
  cacheAble: true,
  // 请求函数
  request: null,
  // 解析接口返回数据函数
  parseData: null,
  // 分页参数字段名 page size
  pageParamsKey: { page: 'page', size: 'size' },
  // 添加自定义组件
  addFormComponent: function({ type, componentName }) {
    addComponent({ type, componentName })
  }
}

export default globalConfig
