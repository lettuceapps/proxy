var url         = require('url'),
    request     = require('request'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function hubProxy(app) {
    app.LOG.info('checking hubroxy');
    return function(req, res, next) {
        app.LOG.info('**** request-hub');
        app.hubUrl = app.hubUrl || ["test_co"];

        var h = req.headers.host.split(':');
        var host = h[0];

        if (host === app.CONFIG.hub.source.host) {
            //req.headers.host = app.CONFIG.hub.host;

            var u = url.parse(req.url);
            var segments = u.pathname.split('/');

            var proxyIt = function(shop) {
                app.LOG.info(app.CONFIG.hub);

                var options = {
                    // forward: { // options for forward-proxy
                    //     port: app.CONFIG.hub.port,
                    //     host: app.CONFIG.hub.host
                    // },
                    target : { // options for proxy target
                        port: app.CONFIG.hub.port,
                        host: app.CONFIG.hub.host,
                        https: true
                    },
                    // source : { // additional options for websocket proxying 
                    //     port: app.CONFIG.hub.port,
                    //     host: app.CONFIG.hub.host,
                    //     https: true
                    // },
                    enable : {
                        xforward: true // enables X-Forwarded-For
                    },
                    changeOrigin: true // changes the origin of the host header to the target URL
                };

                var routingProxy = new httpProxy.RoutingProxy(options);

                if (app.hubUrl.indexOf(shop) != -1) {
                    req.url = '/portal'+ req.url;
                }

                var buffer = httpProxy.buffer(req);

                return routingProxy.proxyRequest(req, res, {
                    host: app.CONFIG.hub.host, 
                    port: app.CONFIG.hub.port,
                    buffer: buffer
                });
            };

            var checkValid = function (www, shop) {
                request(www, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        //app.hubUrl.push(shop);
                        return proxyIt(shop);
                    } else {
                        return next();
                    }
                });
            }

            if (segments.length > 1) {
                var shop = segments[1];
                app.LOG.info('shop :' + JSON.stringify(shop));

                var pathname = u.pathname;

                if (app.hubUrl.indexOf(shop) != -1) {
                    pathname = '/portal'+ u.pathname;
                }

                if (app.hubUrl.indexOf(shop) != -1) {
                    app.LOG.info('cache');
                    return proxyIt(shop);
                } else {
                    app.LOG.info('check');

                    var www = url.format({ 
                        "protocol": 'https',
                        "host":     app.CONFIG.hub.host,
                        "pathname": pathname,
                        "search":   u.search
                    });

                    app.LOG.info('hub :' + www);

                    return checkValid(www, shop);
                }
            } else {
                return next();
            }

        }

       return next();
    }
}

module.exports = hubProxy;