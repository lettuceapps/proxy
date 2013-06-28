#!/usr/bin/env node

var https  = require('https'),
    fs     = require('fs'),
    path   = require('path'),
    server = require('./app/server.js');

var serverPort = server.app.get('port');

server.listen(serverPort, function(){
  console.log("Express server listening on port " + serverPort);
});

// module.exports = server.server;