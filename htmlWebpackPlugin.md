#### 插件使用说明

##### 选项说明

> 插件中的 chunk 选项指定使用的 JS 文件，来自于 webpack entry 选项中的 name

如果不指定则插入所有 JS 文件；如果指定但是不想使用，设置选项 `inject: false`

##### 模版语法

htmlWebpackPlugin.files 对象包含将要渲染到模版文件当中的 JS 和 CSS 路径

```
  <% for(var key in htmlWebpackPlugin.files) { %>
    <%= key %> : <%= JSON.stringify(htmlWebpackPlugin.files[key]) %>
  <% } %>
```

渲染 JS 文件示例

```
  <% for (var i = 0; i < htmlWebpackPlugin.files.js.length; i++) { %>
    <script type="text/javascript" src="<%='/' + htmlWebpackPlugin.files.js[i] %>"></script>
  <% } %>
```

渲染 CSS 文件示例

```
  <link rel="stylesheet" type="text/css" href="<%=htmlWebpackPlugin.files.css[0] %>">
```

##### 配合 extract-text-webpack-plugin 使用

html-webpack-plugin 获取 extract-text-webpack-plugin 提取出的 css 文件，并将其路径置入其 files 属性中