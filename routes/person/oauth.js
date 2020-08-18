/*
 *  github 第三方 登录
 */
const express = require('express');
const router = express.Router();
const request = require('request');
const fs = require('fs');
const path = require('path');

router.post('/github', (req, res, next) => {
    //读取配置文件
    fs.readFile(path.resolve(__dirname, "../../config.json"), 'utf8', function (err, data) {
        if (!err && data) {
            let config = JSON.parse(data);
            let githubConfig = {
                // 客户ID
                // client_ID: '8b089dc0bdefbbfc7d95',
                client_ID: config.oauth.github.client_ID,
                // 客户密匙
                // client_Secret: '61f6952cb122165e69f19f448491054500249715',
                client_Secret: config.oauth.github.client_Secret,
                // 获取 access_token
                // eg: https://github.com/login/oauth/access_token?client_id=7***************6&client_secret=4***************f&code=9dbc60118572de060db4&redirect_uri=http://manage.hgdqdev.cn/#/login
                access_token_url: config.oauth.github.access_token_url,
                // 获取用户信息
                // eg: https://api.github.com/user?access_token=86664b010dbb841a86d4ecc38dfeb8ac673b9430&scope=&token_type=bearer
                user_info_url: config.oauth.github.user_info_url + '?',
                // 回调地址
                redirect_uri: req.headers.origin + '/login'
            };
            let host = 'http://' + req.headers.host;
            let param = req.body;
            let code = param.code || '';
            if (code == '') {
                res.json({ msg: '请输入正确参数！', code: 103, result: false });
                return;
            }
            request({
                url: githubConfig.access_token_url,
                form: {
                    client_id: githubConfig.client_ID,
                    client_secret: githubConfig.client_Secret,
                    code: code,
                    redirect_uri: githubConfig.redirect_uri
                }
            }, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    let urlStr = githubConfig.user_info_url + body;
                    request({
                        url: urlStr,
                        headers: { 'User-Agent': config.oauth.github.name, }
                    }, (error, response, resbody) => {
                        if (!error) {
                            let data = JSON.parse(resbody);
                            // 将获取到的数据存入数据库

                            request({
                                method: 'POST', //请求方式
                                url: `${host}/api/person/user`,
                                form: {
                                    name: data.login,
                                    petname: data.name,
                                    password: data.email ? data.email : data.id,
                                    speech: data.bio,
                                    // date: data.created_at,
                                    // role: data.type,
                                    url: data.avatar_url,
                                    web: data.blog,
                                    bid: data.node_id,
                                    mark: 'oauth',
                                    type: 'y',
                                    admin: "1"
                                }
                            }, (error, response, body) => {
                                if (!error && response.statusCode == 200) {
                                    res.json({
                                        code: 200, result: true, data: {
                                            name: data.login,
                                            password: data.id
                                        }
                                    });
                                } else {
                                    console.log(error);
                                    res.json({ result: false, code: 500 });
                                }
                            });
                        } else {
                            console.log(error);
                            res.json({ msg: '获取用户信息失败！', code: 102, result: false });
                        }
                    })
                } else {
                    console.log(error);
                    res.json({ msg: '获取用户信息失败！', code: 101, result: false });
                }
            })
        } else {
            err = err ? err : '配置信息读取错误！'
            console.log(err);
            res.json({ msg: err, code: 500, result: false });
        }
    });
});

router.post('/gitee', (req, res, next) => {
    fs.readFile(path.resolve(__dirname, "../../config.json"), 'utf8', function (err, data) {
        if (!err) {
            let config = JSON.parse(data);

            let githubConfig = {
                // 客户ID
                // client_ID: 'f8747cff265598b49d5490eec1b922e362c99a332e2ba5592124af3a98884464',
                client_ID: config.oauth.gitee.client_ID,
                // 客户密匙
                // client_Secret: '70a6aa2f40d2f744236457652d57f2c7220735097d5ab61a0c8ffa569f67f218',
                client_Secret: config.oauth.gitee.client_Secret,
                // 获取 access_token
                access_token_url: config.oauth.gitee.access_token_url,
                // 获取用户信息
                user_info_url: config.oauth.gitee.user_info_url,
                // 回调地址
                redirect_uri: req.headers.origin + '/login'
            };

            let host = 'http://' + req.headers.host
            let param = req.body;
            let code = param.code || '';
            if (code == '') {
                res.json({ msg: '请输入正确参数！', code: 103, result: false });
                return;
            }
            request({
                url: githubConfig.access_token_url,
                method: 'POST', //请求方式
                form: {
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: githubConfig.client_ID,
                    client_secret: githubConfig.client_Secret,
                    redirect_uri: githubConfig.redirect_uri
                }
            }, (error, response, redata) => {
                if (!error && response.statusCode == 200) {
                    let body = JSON.parse(redata);
                    request({
                        url: githubConfig.access_token_url,
                        method: 'POST', //请求方式
                        form: {
                            grant_type: 'refresh_token',
                            refresh_token: body.refresh_token
                        },
                        headers: { 'User-Agent': 'zlluGitHub' }
                    }, (error, response, resbody) => {
                        if (!error) {
                            let data = JSON.parse(resbody);
                            // 获取用户信息
                            request({
                                url: githubConfig.user_info_url,
                                form: {
                                    access_token: data.access_token
                                }
                            }, (error, response, resbody) => {
                                if (!error) {

                                    // 将获取到的数据存入数据库
                                    let data = JSON.parse(resbody)
                                    request({
                                        method: 'POST', //请求方式
                                        url: `${host}/api/person/user`,
                                        form: {
                                            name: data.login,
                                            petname: data.name,
                                            // password: data.email,
                                            password: data.email ? data.email : data.id,
                                            url: data.avatar_url,
                                            web: data.blog,
                                            speech: data.bio,
                                            // date: data.created_at,
                                            // role: data.type,
                                            git: data.html_url,
                                            email: data.email,
                                            mark: 'oauth',
                                            type: 'y',
                                            admin: "1"
                                        }
                                    }, (error, response, body) => {
                                        if (!error && response.statusCode == 200) {
                                            res.json({
                                                code: 200, result: true, data: {
                                                    name: data.login,
                                                    password: data.email
                                                }
                                            });
                                        } else {
                                            console.log(error);
                                            res.json({ result: false, code: 500 });
                                        }
                                    });
                                } else {
                                    console.log(error);
                                    res.json({ msg: '获取用户信息失败！', code: 104, result: false });
                                };
                            })

                        } else {
                            console.log(error);
                            res.json({ msg: '获取用户信息失败！', code: 102, result: false });
                        }
                    })
                } else {
                    // res.end(JSON.stringify({
                    //     msg: '获取用户信息失败',
                    //     status: 101
                    // }));
                    console.log(error);
                    res.json({ msg: '获取用户信息失败！', code: 101, result: false });
                }
            })
        } else {
            err = err ? err : '配置信息读取错误！'
            console.log(err);
            res.json({ msg: err, code: 500, result: false });
        }
    });
});
router.post('/gitlab', (req, res, next) => {
    fs.readFile(path.resolve(__dirname, "../../config.json"), 'utf8', function (err, data) {
        if (!err) {
            let config = JSON.parse(data);
            let githubConfig = {
                // 客户ID
                // client_ID: 'f8747cff265598b49d5490eec1b922e362c99a332e2ba5592124af3a98884464',
                client_ID: config.oauth.gitlab.client_ID,
                // 客户密匙
                // client_Secret: '70a6aa2f40d2f744236457652d57f2c7220735097d5ab61a0c8ffa569f67f218',
                client_Secret: config.oauth.gitlab.client_Secret,
                // 获取 access_token
                access_token_url: config.oauth.gitlab.access_token_url,
                // 获取用户信息
                user_info_url: config.oauth.gitlab.user_info_url,
                // 回调地址
                redirect_uri: req.headers.origin + '/login'
            };

            let host = 'http://' + req.headers.host
            let param = req.body;
            let code = param.code || '';
            if (code == '') {
                res.json({ msg: '请输入正确参数！', code: 103, result: false });
                return;
            };
            request({
                url: githubConfig.access_token_url,
                method: 'POST', //请求方式
                form: {
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: githubConfig.client_ID,
                    client_secret: githubConfig.client_Secret,
                    redirect_uri: githubConfig.redirect_uri
                }
            }, (error, response, redata) => {
                if (!error && response.statusCode == 200) {
                    let body = JSON.parse(redata);
                    // 获取用户信息
                    request({
                        url: githubConfig.user_info_url,
                        form: {
                            access_token: body.access_token
                        }
                    }, (error, response, resbody) => {
                        if (!error) {

                            // 将获取到的数据存入数据库
                            let data = JSON.parse(resbody);
                            request({
                                method: 'POST', //请求方式
                                url: `${host}/api/person/user`,
                                form: {
                                    name: data.name,
                                    petname: data.username,
                                    password: data.email ? data.email : data.id,
                                    url: data.avatar_url,
                                    web: data.web_url,
                                    // speech: data.bio,
                                    // date: data.created_at,
                                    // role: data.type,
                                    git: data.web_url,
                                    email: data.email,
                                    mark: 'oauth',
                                    type: 'y',
                                    admin: "1"
                                }
                            }, (error, response, body) => {
                                if (!error && response.statusCode == 200) {
                                    res.json({
                                        code: 200, result: true, data: {
                                            name: data.name,
                                            password: data.email
                                        }
                                    });
                                } else {
                                    console.log(error);
                                    res.json({ result: false, code: 500 });
                                }
                            });
                        } else {
                            console.log(error);
                            res.json({ msg: '获取用户信息失败！', code: 104, result: false });
                        };
                    })
                } else {
                    console.log(error);
                    res.json({ msg: '获取用户信息失败！', code: 101, result: false });
                }
            })
        } else {
            err = err ? err : '配置信息读取错误！'
            console.log(err);
            res.json({ msg: err, code: 500, result: false });
        }
    });
});


// 获取第三方登录信息
router.post('/config', (req, res, next) => {
    //读取配置文件
    fs.readFile(path.resolve(__dirname, "../../config.json"), 'utf8', function (err, data) {
        if (!err && data) {
            data = JSON.parse(data);
            let config = {}
            if (data.oauth && data.oauth.github && data.oauth.github.state) {
                config.github = data.oauth.github.client_ID
            }
            if (data.oauth && data.oauth.gitee && data.oauth.gitee.state) {
                config.gitee = data.oauth.gitee.client_ID
            }
            if (data.oauth && data.oauth.gitlab && data.oauth.gitlab.state) {
                config.gitlab = data.oauth.gitlab.client_ID
            }
            if (data.email && data.email.state) {
                config.email = data.email.state
            }

            //记录访问量
            fs.readFile(path.resolve(__dirname, "../../log/webParame.json"), 'utf8', function (err, data) {
                if (!err && data) {
                    data = JSON.parse(data);
                    data.visits = data.visits * 1 + 1
                    config.visits = data.visits
                    fs.writeFile(path.resolve(__dirname, "../../log/webParame.json"), JSON.stringify(data), 'utf8', function (error) {
                        if (error) { console.log(error); }
                    })
                } else { console.log(err); }
                res.json({ code: 200, result: true, data: config });
            });

        } else {
            console.log(err);
            res.json({ msg: err, code: 500, result: false });
        }
    });


});
module.exports = router;