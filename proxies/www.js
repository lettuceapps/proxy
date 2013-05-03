var url         = require('url'),
    // request     = require('request'),
    // cookie      = require('cookie'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function wwwProxy(app) {
    app.LOG.info('**** checking wwwProxy');
    return function(req, res, next) {
        app.LOG.info('request-www');
        
        //in mem cache shop, first part of path
        app.wwwUrl = app.wwwUrl || ['', 'trial'];

        // // check realm
        // var cookies = cookie.parse(req.headers.cookie);
        // app.realm = cookies.realm || 'www';

        // if (app.realm != 'www') {
        //     return next();
        // }

        //check host name
        var h = req.headers.host.split(':');
        var host = h[0];

        if (host === app.CONFIG.www.source.host) {
            //check if the path works on www
            var u = url.parse(req.url);
            var segments = u.pathname.split('/');

            var proxyIt = function() {
                //app.LOG.info(app.CONFIG.www);

                var options = {
                  // https: {
                    // key: fs.readFileSync('path/to/your/key.pem', 'utf8'),
                    // cert: fs.readFileSync('path/to/your/cert.pem', 'utf8')
                  // },
                    target: {
                        https: isHttps
                    }
                };

                var routingProxy = new httpProxy.RoutingProxy(options);
                var buffer = httpProxy.buffer(req);

                // var realm = cookie.serialize('realm', 'www');

                return routingProxy.proxyRequest(req, res, {
                    // target: {
                        host: app.CONFIG.www.host, 
                        port: app.CONFIG.www.port,
                        buffer: buffer
                    // }
                });
            };

            var checkValid = function (www, shop) {
                www = url.parse(www);
                www.headers = www.headers || {};
                www.headers.cookie = req.headers.cookie;

                // app.LOG.info("cookie: " + JSON.stringify(www.headers.cookie));
                // app.LOG.info("cookie: " + JSON.stringify(req.headers.cookie));

                https.get(www, function(res) {
                    // app.LOG.info("statusCode: ", res.statusCode);
                    // app.LOG.info("headers: ", res.headers);

                    res.on('data', function(d) {
                        // process.stdout.write(d);
                    });

                    res.on('end', function(d) {
                        // app.LOG.info('end');

                        // do what you do
                        if (res.statusCode == 200) {
                            //app.wwwUrl.push(shop);
                            return proxyIt();
                        } else {
                            return next();
                        }

                    });

                }).on('error', function(e) {
                    app.LOG.error(e);
                });
            }

            if (segments.length > 1) {
                var shop = segments[1];
                // app.LOG.info('shop :' + JSON.stringify(shop));
                var protocol = 'http';
                var isHttps = false;

                if (app.CONFIG.www.port == "443") {
                    protocol = 'https';
                    isHttps = true;
                }

                var www = url.format({ 
                    "protocol": protocol,
                    "host":     app.CONFIG.www.host,
                    "pathname": u.pathname,
                    "search":   u.search
                });

                app.LOG.info('www :' + www);

                if (app.wwwUrl.indexOf(shop) != -1) {
                    app.LOG.info('cache');
                    return proxyIt();
                } else {
                    app.LOG.info('check');
                    return checkValid(www, shop);
                }
            } else {
                return next();
            }

        }

       return next();
    }
}

module.exports = wwwProxy;