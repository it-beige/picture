const componentNames = {
  input: 'dynamicInput',
  text: 'dynamicInput',
  textarea: 'dynamicInput',
  password: 'dynamicInput',
  number: 'dynamicInput',
  radio: 'dynamicRadio',
  checkbox: 'dynamicCheckbox',
  select: 'dynamicSelect',
  treeSelect: 'dynamicTreeSelect',
  slider: 'dynamicSlider',
  upload: 'dynamicUpload',
  cascader: 'elCascader',
  switch: 'elSwitch',
  inputNumber: 'elInputNumber',
  time: 'elTimeSelect',
  date: 'elDatePicker',
  datetime: 'elDatePicker',
  datetimerange: 'elDatePicker',
  daterange: 'elDatePicker',
  year: 'elDatePicker',
  month: 'elDatePicker',
  week: 'elDatePicker',
  rate: 'elRate',
  colorPicker: 'elColorPicker ',
  transfer: 'elTransfer'
}

export function addComponent({ type, componentName }) {
  if (type) {
    type = type.toString().toLowerCase()
  } else {
    // eslint-disable-next-line
    console.error(`注册表单组件类型不能为空`)
  }
  componentNames[type] = componentName
}

export function getComponentName(type) {
  if (!type) {
    // eslint-disable-next-line
    console.error(`表单组件不支持的类型：${type}`)
  }
  type = type.toString().toLowerCase()
  if (!Object.keys(componentNames).includes(type)) {
    // eslint-disable-next-line
    console.error(`表单组件不支持的类型：${type}`)
  }
  return componentNames[type]
}
