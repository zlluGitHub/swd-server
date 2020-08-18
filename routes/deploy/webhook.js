
const express = require("express");
const request = require('request');
const fs = require("fs");
const router = express.Router();

router.post('/', (req, res, next) => {
    let resBody = req.body; //Gitea
    let secret = req.get('X-Gitlab-Token'); //gitlab
    let timeout = 15 * 60 * 1000; // 设置超时
    // let query = req.query;
    let url = 'http://' + req.headers.host;
    // let url = 'http://localhost:82'
    if (secret) {
        resBody.secret = secret;
        // // 附加功能 piflow扩展
        // if (secret === '52b9be44219c11720ffb1c1293f1c1445899') {
        //     request({
        //         method: 'POST', //请求方式
        //         url: `${url}/api/synccode/github`,
        //         form: {
        //             commit: resBody.commits[0].message
        //         }
        //     }, function (error, response, data) {
        //         if (!error && response.statusCode == 200) {
        //             console.log('gitlab->github代码同步中...');
        //             res.json({ result: true, code: 200 });
        //         } else {
        //             console.log('gitlab->github代码同步失败！');
        //             res.json({ result: false, code: 500 });
        //         }
        //     });
        // }
    }
    if (req.query.key) {
        resBody.secret = req.query.key; //github
    }
    if (resBody.secret) {
        let gitData = {
            message: resBody.commits ? resBody.commits[0].message : 'github->gitlab代码同步成功!',
            repository: resBody.repository
        };
        let objData = {};

        request({
            url: `${url}/api/deploy/edition/get`,
            method: 'GET',
            timeout: timeout,
            qs: {
                // projectName: 'git测试项目',
                // projectName: resBody.secret,
                key: resBody.secret,
                select: 'one',
                mode: '1'
            }
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let data = JSON.parse(body);
                if (data.data.key && data.data.isAuto === 'yes') {
                    objData = data.data;
                    objData.version = data.version;
                    // 删除文件
                    // fs.unlink('./backups/' + objData.root + '/package.json', (errq) => {
                    // if (errq) {} else {}
                    // 复制文件
                    fs.copyFile('./backups/' + objData.root + '/' + resBody.repository.name + '/package.json', './backups/' + objData.root + '/package.json', function (err) {
                        if (err) {
                            console.log(err)
                            res.json({ result: false, code: 500 });
                        } else {
                            getPullProject();
                        }
                    })
                    // });
                    // getCloneProject();

                } else {
                    console.log('部署配置项有误，请重新填写！');
                    res.json({ result: false, code: 500 });
                }

            } else {
                console.log(error)
                res.json({ result: false, code: 500 });
            }
        });

        //拉取项目
        function getPullProject() {
            request({
                method: 'POST', //请求方式
                url: `${url}/api/deploy/auto/pull`,
                timeout: timeout,
                form: {
                    gitUrl: objData.gitUrl, //git 地址
                    root: objData.root,
                    branch: objData.branch, //git 分支
                    order: objData.order //部署命令
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('项目pull成功，正在检测配置文件是否改变...');
                    fs.readFile('./backups/' + objData.root + '/' + resBody.repository.name + '/package.json', "utf-8", function (err, data1) {
                        fs.readFile('./backups/' + objData.root + '/package.json', "utf-8", function (err, data2) {
                            if (data1 === data2) {
                                console.log('检测配置文件是未改变，正在打包中...');
                                handleBuild();
                            } else {
                                console.log('检测配置文件是已改变，正在克隆项目中...');
                                getCloneProject();
                            }
                        })
                    })
                } else {
                    console.log(error)
                    res.json({ result: false, code: 500 });
                }
            });
        }

        //克隆项目
        function getCloneProject() {
            request({
                method: 'POST', //请求方式
                url: `${url}/api/deploy/auto/clone`,
                timeout: timeout,
                form: {
                    gitUrl: objData.gitUrl, //git 地址
                    root: objData.root,
                    branch: objData.branch, //git 分支
                    order: objData.order //部署命令
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('项目拉取成功，正在安装依赖中...');
                    handleInit();
                } else {
                    console.log(error)
                    res.json({ result: false, code: 500 });
                }
            });
        }

        //初始化项目 安装依赖
        function handleInit() {
            request({
                method: 'POST', //请求方式
                url: `${url}/api/deploy/auto/init`,
                timeout: timeout,
                form: {
                    gitUrl: objData.gitUrl, //git 地址
                    root: objData.root,
                    branch: objData.branch, //git 分支
                    order: objData.order //部署命令
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('依赖安装成功，正在打包中...');
                    handleBuild();
                } else {
                    console.log(error);
                    res.json({ result: false, code: 500 });
                }
            });
        }
        //打包项目
        function handleBuild() {
            request({
                method: 'POST', //请求方式
                url: `${url}/api/deploy/auto/build`,
                timeout: timeout,
                form: {
                    gitUrl: objData.gitUrl, //git 地址
                    root: objData.root,
                    branch: objData.branch, //git 分支
                    order: objData.order //部署命令
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    handleSubmit();
                    console.log('项目打包完成，正在部署中...');
                } else {
                    console.log(error);
                    res.json({ result: false, code: 500 });
                }
            });
        }
        //部署项目（存储信息）
        function handleSubmit() {
            let version = handleVersion(objData.version)
            request({
                method: 'POST', //请求方式
                url: `${url}/api/deploy/edition/add`,
                timeout: timeout,
                form: {
                    projectName: objData.projectName,
                    author: objData.author,
                    url: objData.url,
                    idDeployment: 'yes',
                    isAuto: 'yes',
                    isHistory: objData.isHistory,
                    isPort: objData.isPort,
                    root: objData.root,
                    version: version,
                    uid: objData.bid,
                    key: objData.key,
                    port: objData.port,
                    target: objData.target,
                    portState: objData.portState,
                    authorId: objData.authorId,
                    catalog: objData.catalog,
                    versionRoot: "./" + objData.root + "/" + version,
                    remark: gitData.message,
                    dist: objData.dist,
                    gitUrl: objData.gitUrl, //git 地址
                    branch: objData.branch, //git 分支
                    order: objData.order, //部署命令
                    mode: "1"
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('项目部署完成！');
                    res.json({ result: true, code: 200 });
                } else {
                    console.log(error);
                    res.json({ result: false, code: 500 });
                }
            });
        }


        function handleVersion(val) {
            let arr = val.split(".");
            if (arr[2].indexOf("9") > -1) {
                arr[2] = 0;
                if (arr[1].indexOf("9") > -1) {
                    arr[1] = 0;
                    arr[0] = arr[0] * 1 + 1;
                } else {
                    arr[1] = arr[1] * 1 + 1;
                }
            } else {
                arr[2] = arr[2] * 1 + 1;
            }
            return arr[0] + "." + arr[1] + "." + arr[2];
        }
    } else {
        res.json({ result: false, code: 500 });
    }
});

module.exports = router;







