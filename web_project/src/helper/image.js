// 包内图片必须使用改函数包裹
const getPackImage = function (name) {
  let platform = weex.config.env.platform
  let path = ''
  if (platform == 'Web') { path = `web/res/${name}` }
  else { path = `assets/${name}` }
  return path
}
export default getPackImage
