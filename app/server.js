var fs          = require('fs'),
    path        = require('path'),
    util        = require('util'),
    futures     = require('futures'),
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
    app.use(express.static(__dirname + '/public'));

    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    app.use(app.router);
});

// load controllers
app.LOG.info('load controllers');
require(path.resolve(__dirname, 'controllers/shops'))(app);

var hubKey = new Buffer(app.CONFIG.hub.key).toString('base64');

var options = {
  host: app.CONFIG.hub.host,
  port: 443,
  path: '/v1/wholesale_portal/vanity?all=1',
  method: 'GET',
  headers: { 'Authorization': 'Server ' + hubKey }
};

https.request(options, function(res) {
  //console.log('STATUS: ' + res.statusCode);
  res.setEncoding('utf8');
  var data = '';

  res.on('data', function (d) {
    data += d;
  });

  res.on('end', function(d) {
    app.CONFIG.hub.paths = app.CONFIG.hub.paths || [];
    var result = JSON.parse(data);
    var i;

    for (i = 0; i< result.data.length; i++) {
        var vanity = result.data[i].vanity;

        if (app.CONFIG.hub.paths.indexOf(vanity) === -1) {
            app.CONFIG.hub.paths.push(vanity);
        }
    }

    app.LOG.info(app.CONFIG.hub.paths);
  });
}).end();

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