import DynamicUpload from './src/upload'
DynamicUpload.install = vue => {
  vue.component(DynamicUpload.componentName, DynamicUpload)
}
export default DynamicUpload
