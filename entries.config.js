/**
 * [ENTRIES 多入口配置]
 */
exports.ENTRIES = {
  vendor: './src/assets/js/vendor',
  index: './src/assets/js/main.js',
  PA: './src/assets/js/hello.js',
  less: './src/assets/js/less.js'
}

/**
 * [TEMPLATES html-webpack-plugin 多模版配置]
 * @type {String} template 路径相对于 webpack 配置文件
 * @type {String} filename 路径相对于 webpack output 路径
 * @type {Array} chunks 取自以上 ENTRIES 对象中的 key
 * 其它配置请参考 https://www.npmjs.com/package/html-webpack-plugin
 */
exports.TEMPLATES = [{
  template: './src/index.html',
  filename: '../resource/view/index.php',
  chunks: ['vendor', 'manifest', 'index']
},{
  template: './src/test.html',
  filename: '../resource/view/test.php',
  chunks: ['vendor', 'manifest', 'PA']
},{
  template: './src/less.html',
  filename: '../resource/view/less.php',
  chunks: ['vendor', 'manifest', 'less']
}]