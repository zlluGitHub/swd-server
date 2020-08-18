
const express = require("express");
const router = express.Router();
const fs = require("fs");
let global = require('../../public/javascripts/global.js');
// console.log(global);
const exec = require('child_process').exec;
// 文件存储
let url = './backups/';
// 克隆项目
router.post('/clone', function (req, res, next) {
    let body = req.body;
    let root = body.root
    let branch = body.branch
    let order = body.order
    let gitUrl = body.gitUrl
    if (root && branch && order && gitUrl) {
        let gitName = gitUrl.slice(gitUrl.lastIndexOf("/") + 1, gitUrl.lastIndexOf(".git"))
        function cloneProject() {
            // global.io.emit('message', 'Start creating the contents of files in the folder ...');
            global.io.emit('message', '正在拉取新项目，请稍后 ...');
            exec(`cd ${url + root} && git clone -b ${branch} ${gitUrl}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    global.io.emit('message', error);
                    console.log('错误信息：', error);
                    return res.json({ result: false, code: 500, message: '仓库更新失败！', error: stderr });
                } else {
                    // global.io.emit('message', 'The file contents in the folder were created successfully!');
                    global.io.emit('message', '项目创建成功!');
                    return res.json({ result: true, code: 200, message: '仓库拉取成功！' });
                }
            });
        }
        fs.mkdir(url + root, error => {
            if (error) {
                //判断文件夹是否存在
                fs.exists(url + root + '/' + gitName, (exists) => {
                    if (exists) {
                        // global.io.emit('message', 'Project already exists，start deleting this old item ...');
                        global.io.emit('message', '项目已存在，正在删除当前项目，请稍后 ...');
                        exec(`cd ${url + root} && rm -rf ${gitName}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                            if (error) {
                                console.log('错误信息：', error);
                                global.io.emit('message', error);
                                return res.json({ result: false, code: 500, message: stderr });
                            } else {
                                // global.io.emit('message', 'This old project has been successfully deleted!');
                                global.io.emit('message', '当前项目已删除成功！');
                                cloneProject();
                            }
                        });
                    } else {
                        cloneProject()
                    }
                });
            } else {
                cloneProject()
            };
        });
    } else {
        // global.io.emit('message', 'Clone parameter error!');
        global.io.emit('message', '项目拉取成功!');
        return res.json({ result: false, code: 500, message: '参数错误！' });
    }
});
// 拉取项目
router.post('/pull', function (req, res, next) {
    let body = req.body;
    let root = body.root
    let branch = body.branch
    let gitUrl = body.gitUrl
    if (root && branch) {
        let gitName = gitUrl.slice(gitUrl.lastIndexOf("/") + 1, gitUrl.lastIndexOf(".git"))
        // global.io.emit('message', 'Start pull project, please wait...');
        global.io.emit('message', '正在拉取项目，请稍后 ...');
        exec(`cd ${url + root}/${gitName} && git pull`, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                console.log('错误信息：', error);
                global.io.emit('message', error);
                return res.json({ result: false, code: 500, message: '项目pull失败！', error: stderr });
            } else {
                // global.io.emit('message', 'Project pull successful!');
                global.io.emit('message', '项目拉取成功！');
                return res.json({ result: true, code: 200, message: "项目pull成功!" });
            }
        });
    } else {
        // global.io.emit('message', 'Initialization item parameter error!');
        global.io.emit('message', '项目初始化参数错误！');
        return res.json({ result: false, code: 500, message: '初始化项目参数错误！' });
    }
});

// 初始化项目 安装依赖
router.post('/init', function (req, res, next) {
    let body = req.body;
    let root = body.root
    let order = body.order
    let branch = body.branch
    let gitUrl = body.gitUrl
    if (root && branch) {
        let gitName = gitUrl.slice(gitUrl.lastIndexOf("/") + 1, gitUrl.lastIndexOf(".git"))
        let npm = order.indexOf('cnpm') > -1 ? 'cnpm' : 'npm';
        // global.io.emit('message', 'It may take a few minutes to initialize the project, please wait a moment ...');
        global.io.emit('message', '项目正在初始化中，可能需要一段时间，请耐心等待 ...');
        exec(`cd ${url + root}/${gitName} && ${npm} i`, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                console.log('错误信息：', error);
                global.io.emit('message', error);
                return res.json({ result: false, code: 500, message: '依赖安装失败！', error: stderr });
            } else {
                // global.io.emit('message', 'Project initialization successful!');
                global.io.emit('message', '项目初始化成功！');
                return res.json({ result: true, code: 200, message: "依赖安装成功!" });
            }
        });
    } else {
        // global.io.emit('message', 'Initialization item parameter error!');
        global.io.emit('message', '初始化项目参数错误！');
        return res.json({ result: false, code: 500, message: '初始化项目参数错误！' });
    }
});
// 打包项目
router.post('/build', function (req, res, next) {
    let body = req.body;
    let root = body.root
    let branch = body.branch
    let order = body.order
    let gitUrl = body.gitUrl
    if (root && branch && order && gitUrl) {
        // let npm = order.indexOf('cnpm') > -1 ? 'cnpm' : 'npm';
        order = order.replace(/cnpm/g, "npm")
        let gitName = gitUrl.slice(gitUrl.lastIndexOf("/") + 1, gitUrl.lastIndexOf(".git"))
        if (body.port && body.port !== "") {
            // global.io.emit('message', 'Start packaging project, please wait a moment ...');
            global.io.emit('message', '项目正在打包中，请稍后 ...');
            exec(`cd ${url + root}/${gitName} && ${order}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    console.log('错误信息：', error);
                    global.io.emit('message', error);
                    return res.json({ result: false, code: 500, message: '项目打包失败！', error: stderr });
                } else {
                    // global.io.emit('message', 'Project package successful!');
                    global.io.emit('message', '项目打包成功！');
                    return res.json({ result: true, code: 200, message: "项目打包成功!" });
                }
            });
        } else {
            let str = `module.exports = { publicPath: '/${root}', productionSourceMap: process.env.NODE_ENV === 'production' ? false : true, lintOnSave: false }`
            fs.writeFile(url + root + "/" + gitName + "/vue.config.js", str, function (err2) {
                if (err2) {
                    console.error(err2);
                    res.json({ result: false, code: 500, err: err2 });
                } else {
                    // global.io.emit('message', 'vue.config.js Modification successful, starting to pack ...');
                    global.io.emit('message', '正在打包中，请稍后 ...');
                    console.log('正在打包中，请稍后 ...');
                    exec(`cd ${url + root}/${gitName} && ${order}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
                        if (error) {
                            console.log('错误信息：', error);
                            global.io.emit('message', error);
                            return res.json({ result: false, code: 500, message: '项目打包失败！', error: stderr });
                        } else {
                            // global.io.emit('message', 'Project package successful!');
                            global.io.emit('message', '项目打包成功!');
                            return res.json({ result: true, code: 200, message: "项目打包成功!" });
                        }
                    });
                }
            })
            // // 看是否有端口号
            // if (body.prot) {
            //     //修改 vue.config.js 配置文件
            //     fs.readFile(url + root + "/" + gitName + "/vue.config.js", function (err1, data) {
            //         if (err1) {
            //             console.error(err1);
            //             // res.json({ result: false, code: 500, err: err1 });

            //             console.log('暂无 vue.config.js 配置文件，开始打包中...');
            //             // global.io.emit('message', 'Not yet vue.config.js Configuration file, starting to package ...');
            //             global.io.emit('message', '暂无 vue.config.js 配置文件，正在打包中，请稍后 ...');
            //             exec(`cd ${url + root}/${gitName} && ${order}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
            //                 if (error) {
            //                     console.log('错误信息：', error);
            //                     global.io.emit('message', error);
            //                     return res.json({ result: false, code: 500, message: '项目打包失败！', error: stderr });
            //                 } else {
            //                     // global.io.emit('message', 'Project package successful!');
            //                     global.io.emit('message', '项目打包成功!');
            //                     return res.json({ result: true, code: 200, message: "Project package successful!" });
            //                 }
            //             });
            //         } else {
            //             let str = `module.exports = { publicPath: '/${root}', productionSourceMap: process.env.NODE_ENV === 'production' ? false : true, lintOnSave: false }`
            //             fs.writeFile(url + root + "/" + gitName + "/vue.config.js", str, function (err2) {
            //                 if (err2) {
            //                     console.error(err2);
            //                     res.json({ result: false, code: 500, err: err2 });
            //                 } else {
            //                     // global.io.emit('message', 'vue.config.js Modification successful, starting to pack ...');
            //                     global.io.emit('message', '暂无 vue.config.js 配置文件，正在打包中，请稍后 ...');
            //                     console.log('暂无 vue.config.js 配置文件，开始打包中...');
            //                     exec(`cd ${url + root}/${gitName} && ${order}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
            //                         if (error) {
            //                             console.log('错误信息：', error);
            //                             global.io.emit('message', error);
            //                             return res.json({ result: false, code: 500, message: '项目打包失败！', error: stderr });
            //                         } else {
            //                             // global.io.emit('message', 'Project package successful!');
            //                             global.io.emit('message', '项目打包成功!');
            //                             return res.json({ result: true, code: 200, message: "项目打包成功!" });
            //                         }
            //                     });
            //                 }
            //             })
            //         }
            //     });
            // } else {
            //     console.log('暂无设置端口号，默认打包中...');
            //     // global.io.emit('message', 'The port number is not set yet. It is being packed by default ...');
            //     global.io.emit('message', '暂无设置端口号，默认打包中，请稍后 ...');
            //     exec(`cd ${url + root}/${gitName} && ${order}`, { encoding: 'utf8' }, (error, stdout, stderr) => {
            //         if (error) {
            //             console.log('错误信息：', error);
            //             global.io.emit('message', error);
            //             return res.json({ result: false, code: 500, message: '项目打包失败！', error: stderr });
            //         } else {
            //             // global.io.emit('message', 'Project package successful!');
            //             global.io.emit('message', '项目打包成功!');
            //             return res.json({ result: true, code: 200, message: "项目打包成功!" });
            //         }
            //     });
            // }
        }

    } else {
        // global.io.emit('message', 'Packing parameter error!');
        global.io.emit('message', '项目打包参数错误!');
        return res.json({ result: false, code: 500, message: '打包参数错误！' });
    }
});


module.exports = router;







