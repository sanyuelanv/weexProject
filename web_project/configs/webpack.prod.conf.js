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
const zipPath = fs.createWriteStream(path.join(__dirname, `../../server/static/app.zip`))
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
