var httpProxy   = require('http-proxy');

function proxyProxy(app) {
    app.LOG.info('checking proxy');
   
    var apiVersion = 1.0;
    var pattern = new RegExp('\/api\/' + apiVersion + '\/.*');
    var routingProxy = new httpProxy.RoutingProxy();

    //check configs

    return function(req, res, next) {
        // check host
        var h = req.headers.host.split(':');
        var host = h[0];

        app.LOG.info(host);

        if (host === app.CONFIG.proxy.source.host) {
            if (req.url.match(pattern)) {
            } else {
                next();
            }
        } else {
            next();
        }
    }
}

module.exports = proxyProxy;