'use strict';

var path    = require('path'),
    fs      = require('fs'),
    https   = require('https');


module.exports = function(grunt) {

// var server = require('./app/server.js');
// var serverPort = server.app.get('port');
var serverPort = 443;

  grunt.initConfig({
    express: {
    custom: {
        options: {
          watchChanges: true,
          keepaline: true,
          port: serverPort,
          bases: 'www-root',
          server: path.resolve('./app/server')
      }
    }
    }
  });



  grunt.loadNpmTasks('grunt-express');

  grunt.registerTask('server', ['express', 'express-keepalive']);

//NODE_ENV=production

  // grunt.registerTask('server', 'Start the appllication web server.', function() {

  //   var options = {
  //       key: fs.readFileSync(path.resolve('./ssl_key/lettuceapps.com.key')),
  //       cert: fs.readFileSync(path.resolve('./ssl_key/lettuceapps.com.crt'))
  //   };

  //   https.createServer(options, server).listen(port, function(){
  //     grunt.log.writeln('Starting web server on port ' + port + '.');
  //   });

  // });


  grunt.registerTask('default', ['server']);
}
