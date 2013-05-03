var url         = require('url'),
    // request     = require('request'),
    // cookie      = require('cookie'),
    querystring      = require('querystring'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function hubProxy(app) {
    app.LOG.info('checking hubroxy');
    return function(req, res, next) {
        app.LOG.info('**** request-hub');

        // cache list
        app.hubUrl = app.hubUrl || ["test_co"];
        var realm = 'hub';

        // // check realm
        // var cookies = cookie.parse(req.headers.cookie);
        // app.realm = cookies.realm || 'hub';

        // if (app.realm != 'www') {
        //     return next();
        // }

        // check host
        var h = req.headers.host.split(':');
        var host = h[0];

        if (host === app.CONFIG.hub.source.host) {
            var u           = url.parse(req.url);
            var segments    = u.pathname.split('/');
            var pathname    = u.pathname;
            var qs          = querystring.parse(u.query);
            var shop        = '';

            if (segments.length > 1) {
                shop = segments[1];

                if (app.hubUrl.indexOf(shop) != -1) {
                    pathname = '/portal'+ u.pathname;
                }
            }

            // app.LOG.info(u);
            // app.LOG.info(qs);

            var existShop = function(shop) {
                return app.hubUrl.indexOf(shop) != -1;
            };

            if (qs.hasOwnProperty('realm')) {
                if (qs.realm != 'hub') {
                    return next();
                }
            } else {
                if (!existShop(shop)) {
                return next();
                }
            }

            var proxyIt = function(shop, isLoginRedirect) {
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

                if (isLoginRedirect) {
                    req.url = '/';
                } else if (existShop(shop)) {
                    req.url = '/portal'+ req.url;
                }

                var buffer = httpProxy.buffer(req);

                // var cookies = cookie.parse(req.headers.cookie);
                // var realm = cookie.serialize('realm', 'hub');

                return routingProxy.proxyRequest(req, res, {
                    host: app.CONFIG.hub.host, 
                    port: app.CONFIG.hub.port,
                    buffer: buffer
                });
            };

            var checkValid = function (www, shop) {
                var u2 = url.parse(www);
                app.LOG.info(u2);

                // var options = {
                //     hostname: u2.host,
                //     port: 443,
                //     path: u2.path,
                //     method: 'GET',
                //     headers: {
                //         'Host': u2.host,
                //         'Cookie': req.headers.cookie,
                //     }
                // };

                https.get(www, function(res) {
                    app.LOG.info("statusCode: ", res.statusCode);
                    app.LOG.info("headers: ", res.headers);

                    res.on('data', function(d) {
                        // process.stdout.write(d);
                    });

                    res.on('end', function(d) {
                        app.LOG.info('end');
                        var isLoginRedirect = false;

                        if (res.headers.hasOwnProperty('refresh')) {
                            isLoginRedirect = true;
                        }

                        // do what you do
                        if (res.statusCode == 200) {
                            //app.wwwUrl.push(shop);
                            return proxyIt(shop, isLoginRedirect);
                        } else {
                            return next();
                        }

                    });

                }).on('error', function(e) {
                    app.LOG.error(e);
                });


                // var request = https.request(options, function(response) {
                //     console.log("statusCode: ", response.statusCode);
                //     // console.log("headers: ", response.headers);

                //     // response.on('data', function(d) {
                //         // process.stdout.write(d);
                //     // });

                //     response.on('end', function () {
                //         app.LOG.info('!!!done');

                //         if (response.headers.hasOwnProperty('refresh')) {
                //             isLoginRedirect = true;
                //         }

                //         // do what you do
                //         if (response.statusCode == 200) {
                //             // app.LOG.info('good');
                //             // app.LOG.info('request');
                //             // app.LOG.info(app.wwwUrl);
                //             //app.wwwUrl.push(shop);
                //             return proxyIt(shop, isLoginRedirect);
                //         } else {
                //             return next();
                //         }
                //     });
                // });

                // request.end();

                // request.on('error', function(e) {
                //     app.LOG.error(e);
                // });





                // request(www, function (error, response, body) {
                //     // app.LOG.info('body: ' + body);
                //     app.LOG.info('response: ' + JSON.stringify(response.headers));
                //     app.LOG.info(response.statusCode);

                //     var isLoginRedirect = false;

                //     //check if login redirect
                //     if (response.headers.hasOwnProperty('refresh')) {
                //         isLoginRedirect = true;
                //     }

                //     if (!error && response.statusCode == 200) {
                //         //app.hubUrl.push(shop);
                //         return proxyIt(shop, isLoginRedirect);
                //     } else {
                //         return next();
                //     }
                // });
            }

            if (segments.length > 1) {
                var shop = segments[1];
                var pathname = u.pathname;

                if (existShop(shop)) {
                    pathname = '/portal'+ u.pathname;
                }

                // if (app.hubUrl.indexOf(shop) != -1) {
                //     // app.LOG.info('cache');
                //     return proxyIt(shop, true);
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