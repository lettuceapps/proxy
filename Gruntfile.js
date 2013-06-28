'use strict';

var path    = require('path'),
    fs      = require('fs'),
    https   = require('https');


module.exports = function(grunt) {

  //NODE_ENV=production
  
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

  grunt.registerTask('default', ['server']);
  
}
