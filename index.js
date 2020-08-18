const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fs = require("fs");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();

//解决刷新页面后 页面404
let history = require('connect-history-api-fallback');
// app.use(history({ verbose: true, index: '/index.html'}));
app.use(history());

// // 引入日志
// let { log4js, loggerOfConsole } = require('./log.config.js');
// app.use(log4js.connectLogger(loggerOfConsole, { level: 'auto' }));

// 启用 gzip
let compression = require('compression')
app.use(compression());

// 引入json解析中间件 解决上传内容太多失败
let bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'www')));
app.use(express.static(path.join(__dirname, 'web')));

//解决跨域
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization,Origin,Accept,X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // res.header('X-Powered-By', '3.2.1');
  // res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 路由引入
app.use('/api/person/user', require('./routes/person/user'));
app.use('/api/person/img', require('./routes/person/img'));

app.use('/api/deploy/files', require('./routes/deploy/files'));
app.use('/api/deploy/edition', require('./routes/deploy/edition'));
app.use('/api/deploy/auto', require('./routes/deploy/autoEdition'));
app.use('/api/deploy/git', require('./routes/deploy/webhook'));

app.use('/api/service/operation', require('./routes/service/operation'));
// app.use('/api/service/shell', require('./routes/service/shell'));

// 第三方登录
app.use('/api/person/oauth', require('./routes/person/oauth'));

// // 获取日志
// app.use('/api/logs/run', require('./routes/logs/run'));

// // 同步代码
// app.use('/api/synccode', require('./routes/synccode/index'));

app.use(function (req, res, next) {
  next(createError(404));
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//读取配置文件
fs.readFile(path.resolve(__dirname, "./config.json"), 'utf8', function (err, data) {
  if (!err) {
    let config = JSON.parse(data);
    // 连接数据库
    const mongoose = require('mongoose');
    mongoose.connect(`mongodb://${config.database.ip}:${config.database.port}/SimpleDesign`, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
      if (err) {
        console.log('Connection Error:' + err);
      } else {
        console.log('数据库连接成功!');
      }
    });
    //创建文件夹
    let wwwDir = './www';
    if (!fs.existsSync(wwwDir)) {
      fs.mkdirSync(wwwDir);
    }
    let backupsDir = './backups';
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }
  } else {
    console.log(err);
  }
});

module.exports = app;
