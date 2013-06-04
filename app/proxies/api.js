var httpProxy   = require('http-proxy');

function apiProxy(app) {
    app.LOG.info('checking api');
    var apiVersion = 1.0;
    var pattern = new RegExp('\/' + apiVersion + '\/.*');
    var routingProxy = new httpProxy.RoutingProxy();

    //check configs

    return function(req, res, next) {
        app.LOG.info('request-api');

        if (req.url.match(pattern)) {
            routingProxy.proxyRequest(req, res, {host: app.CONFIG.api.host, port: app.CONFIG.api.port});
        } else {
            next();
        }
    }
}

module.exports = apiProxy;