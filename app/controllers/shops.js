//app = module.parent.exports.app;

module.exports = function(app) {
    app.LOG.info('shops');

    app.post('/api/1.0/shops/vanity', function(req, res) {
        var vanities = app.CONFIG.hub.paths;

        var result = {
            'status': '0',
            'description': 'vanity exists'
        };

        if (vanities.indexOf(req.body.vanity) === -1) {
            vanities.push(req.body.vanity);

            result = {
                'status': '1',
                'description': 'success'
            };
        }

        res.send(JSON.stringify(result));
    });
};