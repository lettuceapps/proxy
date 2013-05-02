var fs          = require('fs'),
    path        = require('path'),
    util        = require('util'),
    winston     = require('winston'),
    cluster     = require('cluster'),
    http        = require('http'),
    https       = require('https'),
    express     = require('express'),
    httpProxy   = require('http-proxy');

var app          = express();
var routingProxy = new httpProxy.RoutingProxy();

app.CONFIG       = require('config');
app.LOG          = winston;

var proxyPath  = app.CONFIG.proxyPath,
    proxies    = [];

function loadProxies(loadPath) {
    var dir = path.resolve(loadPath);

    var files = fs.readdirSync(dir);

    for(var f in files) {
        var file = files[f];
        var aProxy = require(path.join(dir, file));
        // var ext = path.extname(file);
        // var fname = path.basename(file);

        proxies.push(aProxy);
        app.LOG.info('proxy loaded: ' + file);
    }
}

app.configure(function () {
    // load proxies
    loadProxies(proxyPath);

    for(var p in proxies) {
        app.use(proxies[p](app));
    }

    // Static content middleware
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname));

    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    app.use(app.router);
});

app.LOG.info('using port: ' + app.CONFIG.port);
app.listen(app.CONFIG.port);

module.exports = app;
// module.exports = {
//     app: app
// }


// var httpProxy = require('http-proxy'), express = require('express');
// var yahooProxy = httpProxy.createServer(80, 'yahoo.com');
// var app = express.createServer();

// app.configure(function () {
//     app.use('/yahoo', yahooProxy);
// });