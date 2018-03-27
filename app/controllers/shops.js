//app = module.parent.exports.app;

module.exports = function(app) {
    app.LOG.info('vanity api loaded');

    //API TO CREATE A NEW VANITY
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

    //API TO LIST ALL VANITIES
    app.get('/api/v1/vanities', function(req, res) {
        var vanities = app.CONFIG.known_vanities;
        res.send(JSON.stringify({'vanities': vanities}));
    });

    //API TO DELETE EXISTING VANITY
    app.post('/api/v1/vanity/delete', function(req, res) {
        //validate the request first
        // if (req.body.key !== app.CONFIG.server_key) {
        //     res.send(JSON.stringify({
        //         'status': '0',
        //         'description': 'unauthorized'
        //     }));
        //     return;
        // }

        var vanities = app.CONFIG.known_vanities;

        var result = {
            'status': '0',
            'description': 'vanity does not exist'
        };

        var vanityIndex = vanities.indexOf(req.body.vanity);
        if (vanityIndex !== -1) {
            app.CONFIG.known_vanities.splice(vanityIndex, 1);

            result = {
                'status': '1',
                'description': 'success'
            };

            app.LOG.info('removed vanity: ' + req.body.vanity);
        }

        res.send(JSON.stringify(result));
    });

    //API TO REFRESH ALL VANITIES
    app.get('/api/v1/vanities/refresh', function(req, res) {
        var known_vanities = app.CONFIG.known_vanities;
        app.loadKnownVanities(known_vanities.length + 1);
        res.send(JSON.stringify({'status': '1'}));
    });

};