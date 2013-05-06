var url         = require('url'),
    cookie      = require('cookie'),
    querystring      = require('querystring'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function hubProxy(app) {
    app.LOG.info('checking hubroxy');

    var existShop = function(shop) {
        return app.hubUrl.indexOf(shop) != -1;
    };

    var proxyIt = function(shop, redirectPath, req, res) {
        // app.LOG.info(app.CONFIG.hub);

        var options = {
            target : { // options for proxy target
                port: app.CONFIG.hub.port,
                host: app.CONFIG.hub.host,
                https: true
            },
            enable : {
                xforward: true // enables X-Forwarded-For
            },
            changeOrigin: true // changes the origin of the host header to the target URL
        };

        var routingProxy = new httpProxy.RoutingProxy(options);
        var originalUrl = req.url;

        if (redirectPath != '') {
            req.url = redirectPath;
        } else if (existShop(shop)) {
            req.url = '/portal'+ req.url;
        }

        var buffer = httpProxy.buffer(req);

        req.headers['X-Forwarded-Host'] = app.CONFIG.hub.source.host;
        req.headers['X-Forwarded-Path'] = originalUrl;

        return routingProxy.proxyRequest(req, res, {
            host: app.CONFIG.hub.host, 
            port: app.CONFIG.hub.port,
            buffer: buffer
        });
    };

    var checkValid = function (www, shop, req, res) {
        www = url.parse(www);
        www.headers = www.headers || {};
        www.headers.cookie = req.headers.cookie;

        https.get(www, function(response) {
            response.on('data', function(d) {
                // process.stdout.write(d);
            });

            response.on('end', function(d) {
                var redirectPath = '';

                if (response.headers.hasOwnProperty('refresh')) {
                    var refresh = response.headers.refresh.split('=');
                    var uu = url.parse(refresh[1]);

                    app.LOG.info('redirect: ' + uu.path);
                    redirectPath = uu.path;
                }

                // do what you do
                if (response.statusCode == 200) {
                    //app.wwwUrl.push(shop);
                    return proxyIt(shop, redirectPath, req, res);
                } else {
                    return next();
                }

            });

        }).on('error', function(e) {
            app.LOG.error(e);
        });
    };

    return function(req, res, next) {
        app.LOG.info('**** request-hub');

        // cache list
        app.hubUrl = app.hubUrl || ["test_co"];
        var realm = 'hub';

        // check host
        var h = req.headers.host.split(':');
        var host = h[0];

        // check source
        if (host === app.CONFIG.hub.source.host) {
            var u           = url.parse(req.url);
            var segments    = u.pathname.split('/');
            var pathname    = u.pathname;
            var qs          = querystring.parse(u.query);
            var shop        = '';

            // check shop
            if (segments.length > 1) {
                shop = segments[1];

                if (app.hubUrl.indexOf(shop) != -1) {
                    pathname = '/portal'+ u.pathname;
                }
            }

            if (qs.hasOwnProperty('realm')) {
                if (qs.realm != 'hub') {
                    return next();
                }
            } else {
                if (!existShop(shop)) {
                return next();
                }
            }

            if (segments.length > 1) {
                var shop = segments[1];
                var pathname = u.pathname;

                if (existShop(shop)) {
                    pathname = '/portal'+ u.pathname;
                }

                // if (app.hubUrl.indexOf(shop) != -1) {
                //     // app.LOG.info('cache');
                //     return proxyIt(shop, true, req, res);
                // } else 
                if (shop == '') {
                    return next();
                } else {
                    app.LOG.info('check');

                    var www = url.format({ 
                        "protocol": 'https',
                        "host":     app.CONFIG.hub.host,
                        "pathname": pathname,
                        "search":   u.search
                    });

                    app.LOG.info('hub :' + www);

                    return checkValid(www, shop, req, res);
                }
            } else {
                return next();
            }

        }

       return next();
    }
}

module.exports = hubProxy;