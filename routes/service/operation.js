const express = require('express');
const router = express.Router();
// const debug = require('debug')('express-nodejs:server');
// const fs = require("fs");
// const path = require("path");
// const tools = require("../../public/javascripts/tools");
const component = require("../../schema/deploy/edition");
const exec = require('child_process').exec;
const net = require('net')
// const user = require("../../schema/person/user");
const proxy = require("http-proxy-middleware");
let history = require('connect-history-api-fallback');
let global = require('../../public/javascripts/global.js');

//开机自启端口
component.find({}, (err, data) => {
    if (err) {
        console.log('错误信息：', err);
        res.json({
            result: false,
            code: 500
        });
    } else {
        if (data.length !== 0) {
            let obj = {};
            data = data.filter(item => {
                return item.isPort === 'yes' && item.idDeployment === 'yes' && item.port;
            });
            isOpenPort(data);
        }
    }
})

//开启端口
router.post('/open', (req, res, next) => {
    let body = req.body;
    if (body.port === 'all') {
        component.find({}, (err, data) => {
            if (err) {
                console.log('错误信息：', err);
                res.json({
                    result: false,
                    code: 500
                });
            } else {
                isOpenPort(data);
                data.forEach(item => {
                    component.updateMany({ bid: item.bid }, { $set: { isPort: 'yes', } }, (err, data) => {
                        if (err) {
                            console.log('错误信息：', err);
                        }
                    });
                })
                res.json({ result: true, code: 200, message: '端口开启成功！' });
            }
        })
    } else if (isNubmer(body.port * 1)) {
        isOpenPort([body]);
        component.updateMany({ key: body.key }, { $set: { isPort: 'yes', } }, (err, data) => {
            if (err) {
                console.log('错误信息：', err);
            }
        });
        res.json({ result: true, code: 200, message: '端口开启成功！' });
    } else {
        res.json({
            msg: '端口开启失败，请输入正确端口！',
            result: false
        });
    }
});

//刷新404问题
router.post('/history', (req, res, next) => {
    let body = req.body;
    if (body.key && body.isHistory) {
        component.updateMany({ key: body.key }, { $set: { isHistory: body.isHistory, } }, (err, data) => {
            if (err) {
                console.log('错误信息：', err);
                res.json({ result: false, code: 200, mas: "History状态更新失败！" });
            } else {
                // 重启项目
                global.port[body.key].close();
                isOpenPort([body]);
                // exec(`pm2 stop swd-deploy && pm2 start swd-deploy`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                //     if (error) {
                //         console.log('错误信息：', error);
                //         global.io.emit('message', error);
                //         res.json({ result: false, code: 500, message: 'swd-deploy重启失败！', error: stderr });
                //     } else {
                //         // global.io.emit('message', 'Project initialization successful!');
                global.io.emit('message', 'swd-deploy项目重启成功！');
                res.json({ result: true, code: 200, mas: "History状态更新成功！" });
                //     }
                // });
            }
        });
    } else {
        res.json({ result: false, code: 200, mas: "History状态参数有误！" });
    }
});


//关闭端口
router.post('/close', (req, res, next) => {
    let body = req.body;
    if (body.key && global.port[body.key]) {
        global.port[body.key].close();
        component.updateMany({ key: body.key }, { $set: { isPort: 'no', } }, (err, data) => {
            if (err) {
                console.log('错误信息：', err);
                res.json({ result: false, code: 200, mas: "端口状态更新失败！" });
            } else {
                res.json({ result: true, code: 200, message: '端口关闭成功！' });
            }
        });
    } else {
        res.json({ result: false, code: 200, mas: "key 不得为空！" });
    }
});


// 开启端口回调
function isOpenPort(data) {
    //开启端口回调
    // let msgArr = []
    for (let index = 0; index < data.length; index++) {
        let app = express();
        // 解决刷新404问题
        if (data[index].isHistory === 'yes') {
            app.use(history());
        }
        // 解决跨域代理
        let pathRewrite = {}
        pathRewrite['^/' + data[index].root] = "";
        if (data[index].idDeployment === 'yes' && data[index].target) {
            app.use(`/${data[index].root}/**`,
                proxy.createProxyMiddleware({
                    // 代理目标地址
                    target: data[index].target,
                    changeOrigin: true,
                    // ws: true,   
                    // xfwd:true,
                    // 地址重写
                    pathRewrite
                })
            );
        };
        if (data[index].idDeployment === 'yes' && data[index].port) {
            app.use(express.static('./www' + data[index].webUrl));
            let server = app.listen(data[index].port);
            let port = normalizePort(data[index].port);
            server.on('error', function (error) {
                console.log(error);
                if (error.syscall !== 'listen') {
                    // 更新状态
                    // component.updateMany({ bid: data[index].bid }, { $set: { portState: '0' } }, (err, result) => {
                    //     if (err) {
                    //         // res.json({ result: false, code: 500 });
                    //         console.log(data[index].port + '端口数据更新失败！，错误信息：', err);
                    //     } else {
                    //         console.log(data[index].port + '端口数据更新成功！');
                    //         // res.json({ result: true, code: 200 });
                    //     };
                    // });
                    throw error;
                }
                let bind = typeof port === 'string' ?
                    'Pipe ' + port :
                    'Port ' + port;
                switch (error.code) {
                    case 'EACCES':
                        console.error(bind + ' requires elevated privileges');
                        // process.exit(1);
                        // msgArr.push({ port, msg: 'requires elevated privileges' })
                        break;
                    case 'EADDRINUSE':
                        console.error(bind + ' is already in use');
                        // server.close() // 关闭服务
                        // process.exit(1); //结束进程
                        // msgArr.push({ port, msg: bind + ' is already in use' })
                        break;
                    default:
                        // throw error;
                        break;
                }
            });

            server.on('listening', function () {
                global.port[data[index].key] = server;
                let addr = server.address();
                let bind = typeof addr === 'string' ?
                    'pipe：' + addr :
                    'port：' + addr.port;
                // msgArr.push({ port, msg: '端口开启成功，可直接访问：http://localhost:' + bind })
                console.log('The program has successfully run on ' + bind);
            });
        }
    }
    // return msgArr
}
// 检测端口是否被占用
router.post('/test', (req, res, next) => {
    let port = req.body.port * 1;

    // 创建服务并监听该端口
    if (isNubmer(port)) {
        if (port >= 0 && port < 65536) {
            let server = net.createServer().listen(port)
            server.on('listening', function () { // 执行这块代码说明端口未被占用
                server.close() // 关闭服务
                console.log('The port【' + port + '】 is available.') // 控制台输出信息
                res.json({
                    result: true,
                    code: 200,
                    state: 1
                });
            })

            server.on('error', function (err) {
                console.log(err);
                if (err.code === 'EADDRINUSE') { // 端口已经被使用
                    console.log('The port【' + port + '】 already in use, please change other port.')
                    res.json({
                        result: true,
                        code: 500,
                        state: 0
                    });
                } else {
                    res.json({
                        result: true,
                        code: 200,
                        state: -1
                    });
                }
            })
        } else {
            res.json({
                result: true,
                code: 500,
                state: -3
            });
        }
    } else {
        res.json({
            result: false,
            code: 200,
            state: -2
        });
    }
});


function isNubmer(nubmer) {
    var re = /^[0-9]+.?[0-9]*/; //判断字符串是否为数字//判断正整数/[1−9]+[0−9]∗]∗/ 
    return re.test(nubmer)
}

function normalizePort(val) {
    let port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
module.exports = router;