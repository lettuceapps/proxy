'use strict';

var path = require('path');

module.exports = function(grunt) {
  //   grunt.initConfig({
  //       express: {
  //           bases: 'www-root',
  //           server: path.resolve('./server')
  //       }
  //   });

  // grunt.loadNpmTasks('grunt-express');

  // grunt.registerTask('default', ['express']);

//NODE_ENV=production

    var port = 3000;
    grunt.registerTask('server', 'Start a custom web server.', function() {
        grunt.log.writeln('Starting web server on port ' + port);
        require(path.resolve('./server.js')).server.listen(port);
    });


  grunt.registerTask('default', ['server']);

}