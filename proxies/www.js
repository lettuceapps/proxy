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
                https.get(www, function(res) {
                    app.LOG.info("statusCode: ", res.statusCode);
                    app.LOG.info("headers: ", res.headers);

                    res.on('data', function(d) {
                        // process.stdout.write(d);
                    });

                    res.on('end', function(d) {
                        app.LOG.info('end');

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


                // var u2 = url.parse(www);

                // var options = {
                //     host: u2.host,
                //     path: u2.path,
                //     method: 'GET',
                //     headers: {
                //         'Host': u2.host,
                //         'Cookie': req.headers.cookie,
                //     }
                // };

                // var callback = function(response) {
                //     // var str = '';

                //     //another chunk of data has been recieved, so append it to `str`
                //     // response.on('data', function (chunk) {
                //         // str += chunk;
                //     // });

                //     response.on("error", function(e){
                //         app.LOG.error("error: " + e.message);
                //     });

                //     //the whole response has been recieved, so we just print it out here
                //     response.on('end', function () {
                //         // do what you do
                //         if (response.statusCode == 200) {
                //             // app.LOG.info('good');
                //             // app.LOG.info('request');
                //             // app.LOG.info(app.wwwUrl);
                //             //app.wwwUrl.push(shop);
                //             return proxyIt();
                //         } else {
                //             return next();
                //         }
                //     });
                // }

                // http.request(options, callback).end();
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