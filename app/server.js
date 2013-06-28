var fs          = require('fs'),
    path        = require('path'),
    util        = require('util'),
    // futures     = require('futures'),
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
    //load a list of proxies from the config file
    loadProxies(app.CONFIG.proxies);

    for(var p in proxies) {
        app.use(proxies[p](app));
    }

    app.set('port', app.CONFIG.port);

    // Static content middleware
    app.use(express.methodOverride()); //not being used
    app.use(express.bodyParser()); //parsed json string automatically
    app.use(express.static(__dirname + '/public'));

    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));

    app.use(app.router);
});

// load controllers
require(path.resolve(__dirname, 'controllers/shops'))(app);
require(path.resolve(__dirname, 'controllers/health'))(app);

var serverKey = new Buffer(app.CONFIG.server_key).toString('base64');

var options = {
  host: app.CONFIG.destinations.hub.host,
  port: 443,
  path: '/v1/wholesale_portal/vanity?all=1',
  method: 'GET',
  headers: { 'Authorization': 'Server ' + serverKey }
};

https.request(options, function(res) {
  res.setEncoding('utf8');
  var data = '';

  res.on('data', function (d) {
    data += d;
  });

  res.on('end', function(d) {
    app.CONFIG.known_vanities = app.CONFIG.known_vanities || [];

    var result = JSON.parse(data);
    var i;

    for (i = 0; i< result.data.length; i++) {
        var vanity = result.data[i].vanity;

        if (app.CONFIG.known_vanities.indexOf(vanity) === -1) {
            app.CONFIG.known_vanities.push(vanity);
        }
    }

    //output the list of vanities 
    app.LOG.info('known_vanities: ' + JSON.stringify(app.CONFIG.known_vanities));
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