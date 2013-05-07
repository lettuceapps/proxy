var fs          = require('fs'),
    path        = require('path'),
    util        = require('util'),
    winston     = require('winston'),
    cluster     = require('cluster'),
    http        = require('http'),
    https       = require('https'),
    express     = require('express');


var proxies     = [];
var app         = express();

app.CONFIG      = require('config');
app.LOG         = winston;


function loadProxies(files) {
    for(var f in files) {
        var file = files[f];
        var aProxy = require(path.resolve(__dirname, file));

        proxies.push(aProxy);
        app.LOG.info('proxy loaded: ' + file);
    }
}

app.enable('trust proxy');

app.configure(function () {
    // load proxies
    loadProxies(app.CONFIG.proxies);

    for(var p in proxies) {
        app.use(proxies[p](app));
    }

    app.set('port', app.CONFIG.port);

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
var options = {
    key: fs.readFileSync(path.resolve(__dirname, '../ssl_key/lettuceapps.com.key')),
    cert: fs.readFileSync(path.resolve(__dirname, '../ssl_key/lettuceapps.com.crt'))
};

var server = https.createServer(options, app);
server.app = app;

exports = module.exports = server;

// delegates user() function
exports.use = function() {
  app.use.apply(app, arguments);
};