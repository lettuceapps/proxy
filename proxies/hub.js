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

            var proxyIt = function(shop, redirectPath) {
                // app.LOG.info(app.CONFIG.hub);

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

                if (redirectPath != '') {
                    req.url = redirectPath;
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
                www = url.parse(www);
                www.headers = www.headers || {};
                www.headers.cookie = req.headers.cookie;

                // app.LOG.info("cookie: " + JSON.stringify(www.headers.cookie));
                // app.LOG.info("cookie: " + JSON.stringify(req.headers.cookie));
                // www.headers.cookie = "_ok=9693-259-10-6459; PHPSESSID=3n1ps3ht9er75s7bue9hd75b20; optimizelyEndUserId=oeu1367534535185r0.4596896474249661; __qca=P0-1558989966-1367534535834; __utma=215520778.138029794.1367534536.1367534536.1367534536.1; __utmc=215520778; __utmz=215520778.1367534536.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _ok=9197-626-10-3680; intuit.ipp.anywhere.introMessageShown=true; optimizelySegments=%7B%22181248301%22%3A%22false%22%2C%22181250450%22%3A%22gc%22%2C%22181288054%22%3A%22direct%22%7D; optimizelyBuckets=%7B%7D; _sio=f794e490c838445a----529; _okbk=cd5%3Davailable%2Ccd4%3Dtrue%2Cvi5%3D0%2Cvi4%3D1367610771727%2Cvi3%3Dactive%2Cvi2%3Dfalse%2Cvi1%3Dfalse%2Ccd8%3Dchat%2Ccd6%3D0%2Ccd3%3Dfalse%2Ccd2%3D0%2Ccd1%3D0%2C; omp__super_properties=%7B%22all%22%3A%20%7B%22distinct_id%22%3A%20%22nz10vy55vaLpFVjmBhTTr56969325119%22%7D%2C%22events%22%3A%20%7B%7D%2C%22funnels%22%3A%20%7B%7D%7D; __utma=231154653.1293393769.1367527175.1367549538.1367610771.4; __utmc=231154653; __utmz=231154653.1367610771.4.2.utmcsr=preview.lettuceapps.com|utmccn=(referral)|utmcmd=referral|utmcct=/test_co/; ajs_user=%7B%22id%22%3A%22529%22%2C%22traits%22%3A%7B%22email%22%3A%22a%40a.com%22%2C%22username%22%3A%22a%40a.com%22%2C%22name%22%3A%22a%20a%22%7D%7D; mp_44e4fd6193416e7f95a2638a14a14456_mixpanel=%7B%22distinct_id%22%3A%20%22529%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fstaging.lettuceapps.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22staging.lettuceapps.com%22%2C%22mp_name_tag%22%3A%20%22a%40a.com%22%2C%22%24email%22%3A%20%22a%40a.com%22%2C%22%24name%22%3A%20%22a%20a%22%2C%22%24username%22%3A%20%22a%40a.com%22%7D; olfsk=olfsk028726667864248157; _okac=968bec5b45eb59bdd209f81ff1321c14; _okla=1; wcsid=6p4mTk0IwEFlwsyqS78mcHq969325119; hblid=tzfYnvLd45RLq9PAK5NAX1j969325119; _oklv=1367612477672%2C6p4mTk0IwEFlwsyqS78mcHq969325119; ci_session=GCXMTNCIHG1oxXMCS4ArY74ypKjyKL49HIdiFEucD1ktRnFK0g1ckmKYFg%2BLYBTQnZWmGL7wlObkDShmx6dTrxmX6PusA9TdZeW9UrR4flIv7yQiAWzU8beJuRSmqWe6%2BA65MfDjP7loepaVZIRyh6S%2FtZdq6OAKGUV6AWam3ZdFPLqYPw47QlT1cTWrEonKd6CaC1xdndxycRz9HH7bgjkSUgSgJfYXa51RkPPjZLJuauh68e9wdiMtqZ48ZUoB1LrFAqhv4xLyi4AcBV0s70FGyqy6Q36zlmspNXUTEwURaa2iIZHovNchMpy5nQ90YLItAzoWwBFPk31WR1ZFy6mCi2j6aX5KT%2F4UwC212FBnRpR%2Ft9ATRrs1avrB3dKuvEJhzQWmoIESgFMvgX%2F5NJb92vwcaik6yJzB%2BRB3f8o%3D; lettuce.user_id=529; lettuce.user=a%40a.com; lettuce.account_id=35; lettuce.account=Test+Co; lettuce.name=a+a; lettuce.realm_list=%5B%22wp%22%5D; logged_in=1";
                // www.headers.host = www.host;

                https.get(www, function(res) {
                    // app.LOG.info("statusCode: ", res.statusCode);
                    // app.LOG.info("headers: ", res.headers);

                    res.on('data', function(d) {
                        // process.stdout.write(d);
                    });

                    res.on('end', function(d) {
                        // app.LOG.info('end');
                        var redirectPath = '';

                        if (res.headers.hasOwnProperty('refresh')) {
                            var refresh = res.headers.refresh.split('=');
                            var uu = url.parse(refresh[1]);

                            // app.LOG.info(res.headers.refresh);
                            // app.LOG.info(uu);
                            redirectPath = uu.path;
                        }

                        // do what you do
                        if (res.statusCode == 200) {
                            //app.wwwUrl.push(shop);
                            return proxyIt(shop, redirectPath);
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