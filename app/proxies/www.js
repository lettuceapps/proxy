var url         = require('url'),
    cookie      = require('cookie'),
    querystring = require('querystring'),
    http        = require('http'),
    https       = require('https'),
    httpProxy   = require('http-proxy');

function wwwProxy(app) {
    app.CONFIG.known_vanities = null;

    //proxy to the specified destination
    var proxyToDestination = function(destination, vanity, req, res) {
        var options = {
            target : { // options for proxy target
                port: app.CONFIG.destinations[destination].port,
                host: app.CONFIG.destinations[destination].host,
                https: true
            },
            enable : {
                xforward: true // enables X-Forwarded-For
            },
            changeOrigin: true // changes the origin of the host header to the target URL
        };

        var routingProxy = new httpProxy.RoutingProxy(options);
        var originalUrl = req.url;

        //add the portal directory
        if (vanity) {
            req.url = '/portal'+ req.url;
        }

        // app.LOG.info('vanity: ' + vanity);
        // app.LOG.info('redirecting to: ' + destination + ' (' + req.url + ')');

        var buffer = httpProxy.buffer(req);

        req.headers['X-Forwarded-Host'] = app.CONFIG.destinations[destination].host;
        req.headers['X-Forwarded-Path'] = originalUrl;

        return routingProxy.proxyRequest(req, res, {
            host: app.CONFIG.destinations[destination].host, 
            port: app.CONFIG.destinations[destination].port,
            buffer: buffer
        });
    };

    var vanityExists = function(vanity) {
        return (vanity && app.CONFIG.known_vanities.indexOf(vanity) !== -1);
    };

    var findVanity = function (segments) {
        if (segments.length > 1) {
            return segments[1];
        } else {
            return null;
        }
    };

    var getReferer = function (referer) {
        if (referer) {
            referer = referer.replace('https://', '');
            referer = referer.replace('http://', '');

            //remove the port
            if (referer.indexOf(':') !== -1) {
                var firstHalf = referer.substring(0, referer.indexOf(':'));
                var secondHalf = referer.substring(referer.indexOf('/'));
                referer = firstHalf + secondHalf;
            }

            return referer;
        } else {
            return null;
        }
    }

    return function(req, res, next) {
        //get the host from the headers
        var host = req.headers.host.split(':')[0];

        //get the requester
        var referer = getReferer(req.headers.referer);
        var segments    = url.parse(req.url).pathname.split('/');

        //if the host is pinging this proxy directly, then let it pass through.
        //otherwise, proxy it to one of it's sources
        if (app.CONFIG.sources.indexOf(host) !== -1) {
            return next();
        } else {
            var vanity = findVanity(segments);
            var refererVanity = (referer) ? findVanity(referer.split('/', 2)) : null;

            //if the vanity is found in the list of known vanities, then proxy to the HUB
            if (vanityExists(vanity)) {
                // app.LOG.info('proxying to HUB');
                return proxyToDestination('hub', vanity, req, res);
            }

            //if the referrer is from a wp address, then proxy to the hub without the vanity (probably an API call or an asset)
            if (vanityExists(refererVanity)) {
                // app.LOG.info('proxying to HUB from REFERER');
                return proxyToDestination('hub', null, req, res);
            }

            //if the vanity is not found in the list, then proxy to WWW
            
            // app.LOG.info('proxying to WWW');
            return proxyToDestination('www', null, req, res);
        }
    }
}

module.exports = wwwProxy;