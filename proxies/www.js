var url = require('url');
var request = require('request');

function wwwProxy(app) {
    app.LOG.info('checking wwwProxy');
    return function(req, res, next) {
        app.LOG.info('request-www');
        
        var wwwUrl = ['trial'];

        var h = req.headers.host.split(':');
        var host = h[0];
        app.LOG.info(host);

        if (host === app.CONFIG.www.host) {
            //check if the path works on www
            var u = url.parse(req.url);
            var segments = u.pathname.split('/');
            app.LOG.info(u.pathname);

            if (segments.length > 1) {
                var shop = segments[1];
                app.LOG.info(shop);

                if (wwwUrl.indexOf(shop) != -1) {
                    app.LOG.info('found');
                    return;
                }

            }

        }

       next();
    }
}

module.exports = wwwProxy;