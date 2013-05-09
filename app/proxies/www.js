var url         = require('url'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function wwwProxy(app) {
    app.CONFIG.www.paths = [];
    app.LOG.info('checking wwwProxy');

    var proxyIt = function(req, res) {
        var options = {
            target: {
                https: true
            }
        };

        var routingProxy = new httpProxy.RoutingProxy(options);
        var buffer = httpProxy.buffer(req);

        return routingProxy.proxyRequest(req, res, {
            host: app.CONFIG.www.host, 
            port: app.CONFIG.www.port,
            buffer: buffer
        });
    };

    var checkValid = function (www, shop, req, res, next) {
        www = url.parse(www);
        www.headers = www.headers || {};
        www.headers.cookie = req.headers.cookie;

        https.get(www, function(response) {
            response.on('data', function(d) {
                // process.stdout.write(d);
            });

            response.on('end', function(d) {
                // do what you do
                if (response.statusCode == 200) {
                    //app.CONFIG.www.paths.push(shop);
                    return proxyIt(req, res);
                } else {
                    return next();
                }

            });

        }).on('error', function(e) {
            app.LOG.error(e);
        });
    };

    // javascript redirect
    // var redirectToHub() { 
    // };

    return function(req, res, next) {
        app.LOG.info('**** request-www');
        
        //in mem cache shop, first part of path
        app.CONFIG.www.paths = app.CONFIG.www.paths || ['', 'trial'];
        var jsUrl = ['checkout', 'referrals', 'grow', 'shopify', 'shopify_order_and_inventory_management', 'shopify_inventory_management', 'shopify_inventory_management_2'];
        app.CONFIG.www.paths = app.CONFIG.www.paths.concat(jsUrl)

        //check host name
        var h = req.headers.host.split(':');
        var host = h[0];

        if (host === app.CONFIG.www.source.host) {
            //check if the path works on www
            var u = url.parse(req.url);
            var segments = u.pathname.split('/');

            if (segments.length > 1) {
                var shop = segments[1];

                var www = url.format({ 
                    "protocol": 'https',
                    "host":     app.CONFIG.www.host,
                    "pathname": u.pathname,
                    "search":   u.search
                });

                app.LOG.info('www :' + www);

                if (app.CONFIG.www.paths.indexOf(shop) != -1) {
                    return proxyIt(req, res);
                } else {
                    return checkValid(www, shop, req, res, next);
                }
            } else {
                return next();
            }

        }

       return next();
    }
}

module.exports = wwwProxy;