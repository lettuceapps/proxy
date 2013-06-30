//app = module.parent.exports.app;

module.exports = function(app) {
    app.LOG.info('health api loaded');

    app.get('/api/v1/health', function(req, res) {
        res.send(JSON.stringify({'status': 'ok'}));
    });
};