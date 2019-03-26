const Koa = require('koa')
const path = require('path')
const app = new Koa()
const ip = require('ip')
const static = require('koa-static')
const staticPath = './static'
app.use(static(path.join(__dirname, staticPath)))
app.listen(3000)
console.log(`http://${ip.address()}:3000/static/app.zip`)