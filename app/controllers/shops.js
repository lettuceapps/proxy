//app = module.parent.exports.app;

module.exports = function(app) {
    app.LOG.info('vanity api loaded');

    app.post('/api/v1/vanity', function(req, res) {
        //validate the request first
        if (req.body.key !== app.CONFIG.server_key) {
            res.send(JSON.stringify({
                'status': '0',
                'description': 'unauthorized'
            }));
            return;
        }

        var vanities = app.CONFIG.known_vanities;

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

            app.LOG.info('added new vanity: ' + req.body.vanity);
        }

        res.send(JSON.stringify(result));
    });

    app.get('/api/1.0/vanities', function(req, res) {
        var vanities = app.CONFIG.known_vanities;
        res.send(JSON.stringify({'vanities': vanities}));
    });
};