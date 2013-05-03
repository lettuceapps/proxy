var url         = require('url'),
    request     = require('request'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function wwwProxy(app) {
    app.LOG.info('**** checking wwwProxy');
    return function(req, res, next) {
        app.LOG.info('request-www');
        
        //in mem cache shop, first part of path
        app.wwwUrl = app.wwwUrl || ['', 'trial'];

        //host name
        var h = req.headers.host.split(':');
        var host = h[0];

        if (host === app.CONFIG.www.source.host) {
            //check if the path works on www
            var u = url.parse(req.url);
            var segments = u.pathname.split('/');

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

            //app.LOG.info('www :' + www);

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

                return routingProxy.proxyRequest(req, res, {
                    // target: {
                        host: app.CONFIG.www.host, 
                        port: app.CONFIG.www.port,
                        buffer: buffer
                    // }
                });
            };

            var checkValid = function (shop) {
                request(www, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        // app.LOG.info('good');
                        // app.LOG.info('request');
                        // app.LOG.info(app.wwwUrl);
                        app.wwwUrl.push(shop);
                        return proxyIt();
                    } else {
                        return next();
                    }
                });
            }

            if (segments.length > 1) {
                var shop = segments[1];
                // app.LOG.info('shop :' + JSON.stringify(shop));

                if (app.wwwUrl.indexOf(shop) != -1) {
                    // app.LOG.info('cache');
                    return proxyIt();
                } else {
                    // app.LOG.info('check');
                    return checkValid(shop);
                }
            } else {
                return next();
            }

        }

       return next();
    }
}

module.exports = wwwProxy;