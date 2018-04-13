const resolve = require('path').resolve
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const url = require('url')
const publicPath = ''
// 引入配置项
const ENTRIES = require('./entries.config.js').ENTRIES
const TEMPLATES = require('./entries.config.js').TEMPLATES

// ------ webpack.plugins ------
let WebpackPlugins = []
// 配置 CommonsChunkPlugin
const commonsChunkPluginConfig = new webpack.optimize.CommonsChunkPlugin({
  names: ['vendor', 'manifest']
})
WebpackPlugins.push(commonsChunkPluginConfig)

// 配置 ExtractTextPlugin 抽取 css
const extractTextPluginConfig = new ExtractTextPlugin({
  filename: '/static/css/[name].css?[contenthash]',
  allChunks: true
})
WebpackPlugins.push(extractTextPluginConfig)

// 生成 HtmlWebpackPlugin 配置项
WebpackPlugins = WebpackPlugins.concat(TEMPLATES.map(item => {
  return new HtmlWebpackPlugin(item)
}))

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
// ------ webpack.plugins end ------

module.exports = (options = {}) => ({
  entry: ENTRIES,
  output: {
    path: resolve(__dirname, 'public'),
    filename: options.dev ? 'static/js/[name].js' : 'static/js/[name].js?[chunkhash]',
    chunkFilename: 'static/js/[id].js?[chunkhash]',
    publicPath: options.dev ? '/assets/' : publicPath
  },
  module: {
    rules: [{
        test: /\.vue$/,
        use: ['vue-loader']
      },
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: /node_modules/
      },
      {
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
      },
      {
        test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }]
      }
    ]
  },
  plugins: WebpackPlugins,
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src')
    },
    extensions: ['.js', '.vue', '.json', '.css']
  },
  devServer: {
    host: '127.0.0.1',
    port: 8010,
    proxy: {
      '/api/': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    historyApiFallback: {
      index: url.parse(options.dev ? '/assets/' : publicPath).pathname
    }
  },
  devtool: options.dev ? '#eval-source-map' : '#source-map'
})
