const express = require("express");
const router = express.Router();
const readline = require('readline');
const fs = require('fs');
const tools = require("../../public/javascripts/tools");
setInterval(() => {
    if ('23:59:59' == tools.dateTimeSeconds()) {
        fs.writeFile('./log/run.log', '', 'utf8', (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('当前日志文件已成功清除！');
            }
        });
    }
}, 1000);
router.get('/get', async (req, res, next) => {
    let arr = [];
    let query = req.query;
    let pageNo = query.pageNo ? query.pageNo : 1;
    let pageSize = query.pageSize ? query.pageSize : 20;
    const rl = readline.createInterface({
        input: fs.createReadStream('./log/run.log')
    });
    rl.on('line', (line) => {
        // console.log(line)
        arr.push(line)
    });

    rl.on('close', () => {
        // console.log('closed')
        //数据分页处理

        if (query.value) {
            arr = arr.filter(item => {
                return item.indexOf(query.value) > -1
            })
        }
        if (query.startTime) {
            let qTime = new Date(query.startTime).getTime()
            arr = arr.filter(item => {
                let iTime = new Date(item.slice(1, 24)).getTime()

                return iTime > qTime
            })
        }
        if (query.endTime) {
            let qTime = new Date(query.endTime).getTime()
            arr = arr.filter(item => {
                let iTime = new Date(item.slice(1, 24)).getTime()
                return iTime < qTime
            })
        }
        let data = tools.setPage(arr, pageNo, pageSize);
        res.json({ result: true, code: 200, data });
    });
});

module.exports = router;