
let log4js = require("log4js");
let log4js_config = {
    appenders: {
        console: {
            "type": "console",
            "category": "console"
        },
        everything: {
            type: "file",
            filename: "log/run.log",
            //最大文件大小，按字节计算 1024 * 1024 * 8 = 8M 
            //integer (optional) - the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
            maxLogSize: 1024 * 1024 * 20,
            //文件保留数量 
            //integer (optional, default value = 5) - the number of old log files to keep during log rolling.
            backups: 5,
            keepFileExt: true,
            compress: false
        },
        errorFile: {
            type: 'file',
            filename: "log/error.log",
            //最大文件大小，按字节计算 1024 * 1024 * 8 = 8M 
            //integer (optional) - the maximum size (in bytes) for the log file. If not specified, then no log rolling will happen.
            maxLogSize: 1024 * 1024 * 8,
            //文件保留数量 
            //integer (optional, default value = 5) - the number of old log files to keep during log rolling.
            backups: 10,
            keepFileExt: true,
            compress: false
        },
        errors: { type: 'logLevelFilter', level: 'error', appender: 'errorFile' }
    },
    "categories": {
        "default": {
            "appenders": [
                "everything",
                "errors",
                "console"
            ],
            //设置日志记录级别，记录当前级别及以后 ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
            //调试时可以设置为all，线上可设置为INFO
            "level": "ALL"
        }
    },
    //若您的 app 使用了 pm2，则这里必须设置为true，否则日志将不会工作（另外您还得下载 pm2-intercom作为 pm2模块: pm2 install pm2-intercom）
    "pm2": true,
    //(默认 ‘NODE_APP_INSTANCE’)：如果您使用pm2并更改了默认名称，则这里必须要设置。
    // pm2InstanceVar: 'INSTANCE_ID',
    //使用的 log4js 忽略集群环境（clustered environments）或者你在 pm2 日志中遇到了麻烦。每一个工作进程都将进行自己的日志记录。请小心使用这里如果你要把日志记录输出到文件。
    // disableClustering: true,
    "replaceConsole": true
};

//接管console日志，自动区分类别
log4js.configure(log4js_config);

const loggerOfConsole = log4js.getLogger('console');
console.log = loggerOfConsole.info.bind(loggerOfConsole); // do the same for others - console.debug, etc.
console.trace = loggerOfConsole.info.bind(loggerOfConsole);
console.error = loggerOfConsole.info.bind(loggerOfConsole);
console.debug = loggerOfConsole.info.bind(loggerOfConsole);
console.warn = loggerOfConsole.info.bind(loggerOfConsole);
console.info = loggerOfConsole.info.bind(loggerOfConsole);

module.exports = { log4js, loggerOfConsole }