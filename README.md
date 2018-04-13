这是一份可以快速在不同 PHP 项目移植的 webpack 配置，适合仅使用 PHP 路由，支持版本号和走接口获取数据的前端项目。

首先来看看打包编译的结果：

经过打包编译后的资源文件将会放到 `public/static/`，模版文件放到 `resource/view/`。


```
public
  |_static
    |_css
        |_*.css
      |_js
        |_*.js
          |_verdor.js
          |_manifest.js
resource
  |_view
    |_*.php
```


打包前的 src 文件在项目根目录:


```
src
  |_assets
    |_css
        |_*.css
      |_js
        |_*.js
  |_*.html // 模版文件
```


在这里使用 webpack + html-webpack-plugin + extract-text-webpack-plugin 来完成目标。

先编写一份静态资源和模版文件的入口配置：

```
// entries.config.js
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
```

在 webpack.config.js 引入该配置

```
// webpack.config.js
// 引入配置项
const ENTRIES = require('./entries.config.js').ENTRIES
const TEMPLATES = require('./entries.config.js').TEMPLATES
```

其中 `ENTRIES` 配置到 `entry` 选项，`TEMPLATES` 对象需要遍历并生成一份 `html-webpack-plugin` 配置，然后合并到 `plugin` 选项中。

具体配置如下：


```
// webpack.config.js
let WebpackPlugins = []
const TEMPLATES = require('./entries.config.js').TEMPLATES
WebpackPlugins = WebpackPlugins.concat(TEMPLATES.map(item => {
  return new HtmlWebpackPlugin(item)
}))
module.exports = () => {
	// ... 其它配置
	plugins: WebpackPlugins
}
```	


> 必须注意的是，`html-webpack-plugin` 的 `chunks` 选项照搬 webpack 配置中的 `entry` 对象。而 PHP 项目中静态资源的路径通常是 `/static/***`。问题是 `entry` 中的路径不能加 `/` 否则会提示不能使用绝对路径的错误。

我们可以采用模版语法的方式来解决这个问题：

在 `index.html` 的 `</body>` 前写


```
  <% for (var i = 0; i < htmlWebpackPlugin.files.js.length; i++) { %>
    <script type="text/javascript" src="<%='/' + htmlWebpackPlugin.files.js[i] %>"></script>
  <% } %>
```


在 `<head></head>` 内写


```
  <link rel="stylesheet" type="text/css" href="<%=htmlWebpackPlugin.files.css[0] %>">
```


> `extract-text-webpack-plugin` 插件能将 js 中引入的 css 拆分，并提供路径到 `html-webpack-plugin` 插件编译时的 `htmlWebpackPlugin.files` 对象中


配置如下：


```
// webpack.config.js
module.exports = () => {
	module: {
		rules: [{
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'less-loader', 'postcss-loader']
        })
      }]
	}
}
```


此外还需要给 `WebpackPlugins` 塞入一段配置：


```
// webpack.config.js
const extractTextPluginConfig = new ExtractTextPlugin({
  filename: '/static/css/[name].css?[contenthash]',
  allChunks: true
})
WebpackPlugins.push(extractTextPluginConfig)
```


编译成功后，我们可以在 `resource/view/` 下看到一份静态资源路径正确的 .php 文件


```
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>element-starter</title>
<link href="/static/css/index.css?30c7c1357cd3f179a91620a257d3a1cb" rel="stylesheet"></head>

<body>
  <div id="app"></div>
<script type="text/javascript" src="/static/js/manifest.js?1bd9828a3b989a360b40"></script><script type="text/javascript" src="/static/js/vendor.js?8e9cb5738871c3a4bd53"></script><script type="text/javascript" src="/static/js/index.js?d1589dd0debd2a52c5b8"></script></body>

</html>
```


以上解决模版静态资源路径问题的方法有点麻烦，因为你需要在每一份模版源写上这些难看的模版语法。查询 `html-webpack-plugin` 官方文档，得知它在编译时提供了几个事件:

* html-webpack-plugin-before-html-generation
* html-webpack-plugin-before-html-processing
* html-webpack-plugin-alter-asset-tags
* html-webpack-plugin-after-html-processing
* html-webpack-plugin-after-emit

> 我猜测该插件在进行模版渲染前的数据源是 `htmlWebpackPlugin` 对象，你可以使用模版语法将它打印出来看看。

因此可以写一个 webpack 插件，监听该插件编译到模版渲染前，修改它的静态资源路径数据来达到目的。[参考文档](https://www.npmjs.com/package/html-webpack-plugin)

这是一个很简单的 webpack 插件：


```
// webpack.config.js
// 监听 HtmlWebpackPlugin 插件并修改其中js的路径
function HtmlPluginPath(options) {}
HtmlPluginPath.prototype.apply = function(compiler) {
  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData, callback) {
      htmlPluginData.assets.js = htmlPluginData.assets.js.map(item => {
        return '/' + item
      })
      callback(null, htmlPluginData)
    })
  })
}
WebpackPlugins.push(new HtmlPluginPath())
```


该插件通过监听 `html-webpack-plugin-before-html-processing` 事件在模版渲染前将 `htmlPluginData.assets.js` 中的元素（资源路径）前添加了 `/` 来解决问题，可以放弃麻烦的模版语法了。 