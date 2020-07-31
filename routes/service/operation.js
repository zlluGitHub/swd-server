const express = require('express');
const router = express.Router();
const debug = require('debug')('express-nodejs:server');
// const fs = require("fs");
// const path = require("path");
// const tools = require("../../public/javascripts/tools");
const component = require("../../schema/deploy/edition");
// const exec = require('child_process').exec;
const net = require('net')
// const user = require("../../schema/person/user");
const proxy = require("http-proxy-middleware");
let history = require('connect-history-api-fallback');

//开机自启所有端口
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
            data = data.reduce(function (item, next) {
                obj[next.port] ? '' : obj[next.port] = true && item.push(next);
                return item;
            }, []);
            isOpenPort(data);
        }
    }
})


//开启端口
router.post('/open', (req, res, next) => {
    let body = req.body ? req.body : {
        port: 'text'
    }
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
                res.json({
                    msg: ' 端口开启成功！',
                    result: true
                });
            }
        })
    } else if (isNubmer(body.port * 1)) {
        isOpenPort([body]);
        res.json({
            msg: body.port + '端口开启成功！',
            result: true
        });
    } else {
        res.json({
            msg: '端口开启失败，请输入正确端口！',
            result: false
        });
    }
});


//关闭端口
// router.get('/close', (req, res, next) => {
//     // let body = req.body;
//     let array = [3000, 3030]
//     for (let index = 0; index < array.length; index++) {
//         let app1 = express();
//         app1.use(express.static('./www/text' + (index + 1)));
//         let server1 = app1.listen(array[index], function () {
//             server1.address().address;
//             server1.address().port;
//             console.log(array[index] + '端口已经开启')
//         });
//     }
//     res.json({ msg: '端口开启成功！', result: true });
// });


// 开启端口回调
function isOpenPort(data) {
    //开启端口回调
    // let msgArr = []
    for (let index = 0; index < data.length; index++) {
        let app = express();
        // 解决刷新404问题
        // if (condition) {
        //     app.use(history());
        // }
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
        }

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
                        throw error;
                }
            });

            server.on('listening', function () {
                let addr = server.address();
                let bind = typeof addr === 'string' ?
                    'pipe ' + addr :
                    'port ' + addr.port;
                // msgArr.push({ port, msg: '端口开启成功，可直接访问：http://localhost:' + bind })
                console.log('请访问：localhost:' + bind);
                debug('请访问：localhost:' + bind);
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
            if (err.code === 'EADDRINUSE') { // 端口已经被使用
                console.log('The port【' + port + '】 is occupied, please change other port.')
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