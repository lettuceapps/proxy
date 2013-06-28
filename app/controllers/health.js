//app = module.parent.exports.app;

module.exports = function(app) {
    app.LOG.info('health');

    app.get('/api/1.0/health/alive', function(req, res) {
        res.send(JSON.stringify({'status': 'ok'}));
    });
};