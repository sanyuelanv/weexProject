## `weex` 简介
### 什么是 `weex`
  [简介见官网](https://weex.apache.org/zh/guide/introduction.html)
### 如何使用 `weex`
`weex` 的使用分两种：一种是直接新创建一个 `weex` 的工程，用内置的命令去打包成一个原生安装包，这种方法是所有只会前端开发的人的最好追求。因为你不需要学习其他两门语言即可完成全平台的开发。但短板也很大，就是你只能使用官方内置或者网上开源的东西。  
而如果你会 `Object C` , `java` , `javaScript` 和一点后端知识的话，那么打包成 `js bundle` 文件接入到原生APP去会是一个很不错的方式。而接下来我要说的就是这种方法。所有你需要懂的一点点 `Object C` ,一点点 `java` ,一点点 `javaScript` 和一点后端的知识。
## 基于三端的简单的框架搭建
`weex` 打包出 `js bundle` 文件 - 压缩成 `zip` 文件并上传到静态文件服务器 - 客户端下载 `zip` 文件并解压 - 打开 `js bundle` 文件。  
而基于 `weex` 在静态资源的处理上的短板（无法引入本地资源）。我们优化一下整个流程。在打包成 `zip` 文件的时候，带上需要用到的静态文件（如图片）。再通过自定义客户端关于图片的 `Handler` / `Adapter` 的处理。让我们可以用得到这些文件。
### 1. weex 工程文件的创建和修改
使用 `weex-toolkit` 我们可以快速创建一个 `weex` 的工程文件，但这个工程并不是我们想要的最终形态，因此我们需要把它进行一下修改。  
进入到 `webProject` 目录里面启动 `weex`的初始化命令：目前是这里使用的是 `v1.3.11` 版本的 `weex-toolkit`  
```
weex create web_project
```
然后一路回车确认，直到 `Use vue-router to manage your view router` 这里的时候我们需要选择 `no` 。而后面的几个是否需要 `ESLint` 和 `test` 的话则看个人喜好了。我们的 `demo` 例子则选择了不需要。然后则是漫长的下载依赖包过程。   
下载完成后我们工程的目录就变成，后面还会在内部继续拓展。但目前这个项目的结构如下：
```
weexProject
└── web_project
    ├── README.md
    ├── android.config.json //删除
    ├── configs
    ├── ios.config.json  //删除
    ├── node_modules
    ├── package-lock.json
    ├── package.json
    ├── platforms  //删除
    ├── plugins  //删除
    ├── src
    │ ├── components
    │ │   └── HelloWorld.vue
    │ ├── entry.js
    │ └── index.vue
    ├── web  
    │   ├── assets/
    │   │   ├── preview.css
    │   │   └── qrcode.js
    │   ├── res/ 创建
    │   ├── index.html
    │   └── preview.html
    └── webpack.config.js
```  
按照上面树状图删掉和创建目录和文件之后，我们还需要改造一下里面的文件。现在先写一个简单的 `demo`

```javascript
// web_project/src/index.vue
<template>
  <div class="wrapper">
    <image :src="webImage" class="webImage"></image>
    <image :src="localImage" class="localImage"></image>
    <text class="greeting">Hello！</text>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      webImage: "https://cn.vuejs.org/images/logo.png",
      localImage:''
    };
  }
};
</script>

<style scoped>
.wrapper {
  justify-content: center;
  align-items: center;
}
.webImage {
  width: 200px;
  height: 200px;
  margin-bottom: 50px;
}
.localImage {
  width: 320px;
  height: 151px;
}
.greeting {
  text-align: center;
  margin-top: 70px;
  font-size: 50px;
  color: #41b883;
}
</style>
```
由于 `weex` 的 `image` 设计是不加载本地图片的，而我们需要在三个端上（web / ios / android）都拓展这个功能，因此我们需要创建一个函数来帮我们完成这件事
```javascript
// web_project/src/helper/image.js
const getPackImage = function (name) {
  const { platform } = weex.config.env
  let path = ''
  if (platform == 'Web') { path = `web/res/${name}` }
  else { path = `assets/${name}` }
  return path
}
export default getPackImage
```
这里我们先引入了 `weex.config.env.platform` 这个全局变量来判断所处于的环境，针对 `web` 端 和 `native` 端作出不同的图片路径。而为了能正确的读入这个图片，我们需要在 `web_project/web/res` 这个自己创建的目录里面添加一张新的图片 `1.png`。同时，对 `index.vue` 的 script 部分进行改写。
```javascript
// web_project/src/index.vue 的 script 部分
<script>
import getPackImage from "./helper/image";
export default {
  name: "App",
  data() {
    return {
      webImage: "https://cn.vuejs.org/images/logo.png",
      localImage:getPackImage('1.png')
    };
  }
};
</script>
```
这时候运行 `npm run serve` 的话，就能在浏览器看到一个不错的效果了。但这仅仅是开发时候的效果，为了让打包的时候能把这些素材带上，我们还得继续修改。查看 `package.json` 文件，我们可以发现有一条这样的命令：`"build:prod": "webpack --env.NODE_ENV=production"` 。这是再追溯到 `webpack` 的配置文件 `webpack.config.js` 里面。
```javascript
case 'prod':
case 'production':
  webpackConfig = require('./configs/webpack.prod.conf');
```
可以看到最终的配置文件来自 `web_project/configs/webpack.prod.conf.js`。由于我们整个项目不需要打包出一个 `web` 端的页面。因此我们这个配置文件进行一些修改
```javascript
// 先安装依赖
npm i --save-dev archiver clean-webpack-plugin
// web_project/configs/webpack.prod.conf.js
const commonConfig = require('./webpack.common.conf');
const webpackMerge = require('webpack-merge');
const os = require('os');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const archiver = require('archiver')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const config = require('./config');
const UglifyJsparallelPlugin = require('webpack-uglify-parallel');
const zipPath = fs.createWriteStream(path.join(__dirname, `../app.zip`))
const createZip = function () {
  return new Promise(function (resolve, reject) {
    const output = zipPath
    const archive = archiver('zip')
    archive.on('error', function (err) {
      console.log(err)
      resolve(false)
    })
    archive.on('end', function (err) {
      if (err) { console.log(err) }
      resolve(true)
    })
    archive.pipe(output)
    archive.directory(path.join(__dirname, '../dist'), false)
    archive.finalize()
  })
}
// 复制资源
class copyAssets {
  apply (compiler) {
    compiler.plugin('done', function(compilation){
      // 复制 文件
      const inDir = path.resolve(__dirname, `../web/res`)
      const outDir = path.resolve(__dirname, `../dist/assets`)
      const res = fs.readdirSync(inDir)
      if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir) }
      for (let index = 0; index < res.length; index++) {
        const element = res[index]
        fs.createReadStream(path.resolve(__dirname, `${inDir}/${element}`)).pipe(fs.createWriteStream(path.resolve(__dirname, `${outDir}/${element}`)))
      }
    })
  }
}
// dist 打包 zip 包
class zipPack {
  apply (compiler) {
    compiler.plugin('done', async function(compilation){
      await createZip()
    })
  }
}

const weexConfig = webpackMerge(commonConfig[1], {
    plugins: [
      new UglifyJsparallelPlugin({
        workers: os.cpus().length,
        mangle: true,
        compressor: {
          warnings: false,
          drop_console: true,
          drop_debugger: true
        }
      }),
      ...commonConfig[1].plugins,
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': config.prod.env
        }
      }),
      new CleanWebpackPlugin(),
      new copyAssets(),
      new zipPack()
    ]
})

module.exports = [weexConfig]

```
简单总结一下这里的修改，我们先是去掉了一个 `webConfig` 的配置。增加了三个 `plugins` 分别用来删除指定打包目录（免得上一次的内容留着），把素材从指定目录复制出来，和用来压缩整个 `dist` 目录成为一个 `app.zip` 的。
这时候我们运行一个 `npm run build:prod` 则会在 `web_project` 里面生成一个 `app.zip` 文件。
### 2. 简单的服务器搭建
在 `weexProject` 目录下创建一个 `server` 目录。用于建造一个简单的静态服务器，用于刚才打包好的 `app.zip` 文件的分发。
```
// 目录架构
weexProject
├── server
└── web_project
```
先是使用 `npm init` 来创建一个项目，一直回车确认就可以了。然后我们需要安装两个依赖 `npm i --save-dev koa koa-static ip`。安装好了之后，创建一个 `index.js` 文件和一个 `static` 目录
```javascript
// weexProject/server/index.js
const Koa = require('koa')
const path = require('path')
const app = new Koa()
const ip = require('ip')
const static = require('koa-static')
const staticPath = './static'
app.use(static(path.join(__dirname, staticPath)))
app.listen(3000)
console.log(`http://${ip.address()}:3000/static/app.zip`)
```
通过执行 `node index.js` 我们就拥有了一个用来下载静态文件的服务器了，到了我们只需要修改一下 `web_project/configs/webpack.prod.conf.js` 的配置文件里面的 `zipPath` 变量即可.
```javascript
// 旧的
//const zipPath = fs.createWriteStream(path.join(__dirname, `../app.zip`))
// 新的
const zipPath = fs.createWriteStream(path.join(__dirname, `../../server/static/app.zip`))
```
这样下来，我们的只需要访问 `http://${ip.address()}:3000/static/app.zip` 即可获取到最新的 `zip` 包文件。


## Handler 接入
  ### 图片展示
  ### http 
  ### webSocket
## module 接入：
  ### 监听网络状态 
  ### 获取一些数据
## component 接入
  ### 输入框的接入
## 多页面开发

