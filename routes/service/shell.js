const express = require('express');
let http = require('http');
let fs = require('fs');
let ws = require('socket.io'); //引入socket.io
let global = require('../../public/javascripts/global.js');
const router = express.Router();
const net = require('net')
const exec = require('child_process').exec;

router.post('/open', (req, res, next) => {
    let port = 8082
    createShellServe(port, res)


});
router.post('/close', (req, res, next) => {
    // let port = req.query.port
    let port = req.body.port
    // console.log(port);
    if (global[port * 1]) {
        global[port * 1].close();
        global[port * 1] = null;
        let server = net.createServer().listen(port)
        server.on('listening', function () { // 执行这块代码说明端口未被占用
            server.close() // 关闭服务
            console.log('The port【' + port + '】 is closed.') // 控制台输出信息
            res.json({
                result: true,
                code: 200,
                mas: 'Shell ' + port + ' 关闭成功！'
            });
        })

        server.on('error', function (err) {
            res.json({
                result: true,
                code: 500,
                mas: 'Shell ' + port + ' 关闭失败！'
            });
        })
    } else {
        res.json({
            result: true,
            code: 200,
            mas: 'Shell ' + port + ' 并未开启！'
        });
    }
});

createShellServe = function (port, res) {
    // shell服务
    let server = http.createServer().listen(port);

    server.on('listening', function () { // 执行这块代码说明端口未被占用
        global[port * 1] = server
        let io = ws(server);
        //监听用户的连接事件
        io.on('connection', function (socket) {
            //发生在用户连接io服务器时
            console.log('socket shell connection successful! Service listening on ' + port + ' port.');
            socket.on('message', function (obj) {
                //  console.log(obj);
                if (obj === 'x') {
                    // 退出注册表进程
                    //  child_process.unref();
                    io.emit('message', "This process has terminated!");
                } else if (obj === '?') {
                    io.emit('message', "（x）结束当前进程;（?）帮助;");
                } else {
                    exec(obj, { encoding: 'utf8' }, (error, stdout, stderr) => {
                        if (error) {
                            console.log('错误信息：', error);
                            io.emit('message', `Error: Command failed: ${error}`);
                        } else {
                            io.emit('message', stdout);
                        }
                    });
                }
            });
            global.io = io;

        });
        res.json({
            result: true,
            code: 200,
            port
        });
    })


    server.on('error', function (err) {
        console.log(err);
        port = port + 1
        createShellServe(port, res)
    })
}

module.exports = router;