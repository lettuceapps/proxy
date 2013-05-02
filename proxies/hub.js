function hubProxy(app) {
    app.LOG.info('checking hubroxy');
    return function(req, res, next) {
        app.LOG.info('request-hub');
        next();
    }
}

module.exports = hubProxy;