'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    gas: grunt.file.readJSON('gas.json'),

    timestamp: Date(),

    jshint: {
      files: [
        'Gruntfile.js',
        'src/**/*.js',
        'test/spec/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    clean: {
      tmp: [ 'tmp'
           ]
    },

    shell: {
      'mktmp': {
        command: [
          'mkdir tmp'
        ].join('&&')
      },

      'timestamp': {
        command: 'echo "<%= timestamp %>" > tmp/timestamp',
        options: {
          failOnError: true
        }
      },

      'run': {
        command: function () {
          return Array.prototype.slice.call(arguments).join(' ');
        },
        options: {
          stdout: true,
          failOnError: true
        }
      },

      'nml': {
        command: function () {
          return ('node_modules/.bin/nml ' + Array.prototype.slice.call(arguments).join(' '));
        },
        options: {
          stdout: true,
          failOnError: true
        }
      },

      'rajah': {
        command: function () {
          return ('node_modules/.bin/rajah ' + Array.prototype.slice.call(arguments).join(' '));
        },
        options: {
          stdout: true,
          failOnError: true
        }
      },

      'gas-upload': {
        command: function (target, filepath) {
          return 'node_modules/.bin/gas upload' +
                 ' -f ' + this.config.get('gas')[target].fileId +
                 ' -S ' + this.config.get('gas')[target].filename + ':' + filepath +
                 ' -c ' + this.config.get('gas')[target].credential;
        },
        options: {
          stdout: true,
          failOnError: true
        }
      },

      'gas-wget': {
        command: function (target, filepath, options) {
          // return 'wget' +
          //        ' "' + this.config.get('gas')[target].dogetUrl + (options ? options : '') + '"' +
          //        ' --load-cookies=' + this.config.get('gas')[target].dogetCookie +
          //        ' -O ' + filepath;
          return 'w3m' +
                 ' -dump' +
                 ' ' + this.config.get('gas')[target].dogetUrl + (options ? options : '') +
                 ' | tee ' + filepath;
        },
        options: {
          stdout: true,
          failOnError: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');


  grunt.registerTask('check-result', 'Sub task for remote-test.', function(filepath, expected, opt) {

    var resultText;

    try {
      resultText = grunt.file.read(filepath);
    } catch(e) {
      grunt.log.error("FILE-READ-ERROR: " + filepath + "\n" + e);
      return false;
    }

    var actual = resultText.split('\n', 3),
        timestamp = grunt.config.get('timestamp'),
        resultStatus = null,
        stampConfirmed = false;

    /*
     *  Check First line.
     */
    if (resultText.indexOf('<!DOCTYPE html>') >= 0) {
      var title = resultText.match(/<\s*title\s*>(.+?)<\s*\/\s*title\s*>/i)[1];

      if (title.indexOf('Meet Google Drive') === 0) {
        resultStatus = 'ACCESS-ERROR: page title = ' + title;

      } else if (title === 'Error') {
        resultStatus = 'GAS-ERROR';

      } else {
        resultStatus = 'UNKNOWN-HTML-ERROR';
      }

    } else if (actual[0] === '[ STAMP NOT FOUND ]') {
      stampConfirmed = false;

    } else if (actual[0] === timestamp) {
      stampConfirmed = true;

    } else {
      resultStatus = 'STAMP-NOT-MATCH';
    }

    if (resultStatus !== null) {
      grunt.log.error(resultStatus + ':');
      return false;
    }


    /*
     *  Check 2nd. line.
     */
    if (actual[1] === 'doGet Exception:') {
      resultStatus = 'DOGET-EXCEPTION';

    } else if (actual[1] === 'Rajah Error:') {
      if (actual[2].indexOf('Error:') === 0) {
        if (expected !== 'error') {
          resultStatus = 'RAJAH-ERROR';
        } else {
          return true;
        }

      } else if (actual[2].indexOf('Exception:') === 0) {
        if (expected !== 'exception') {
          resultStatus = 'RAJAH-EXCEPTION';
        } else {
          return true;
        }

      } else {
        resultStatus = 'RAJAH-UNKNOWN-ERROR';
      }

    } else if (actual[1] !== 'Started') {
      resultStatus = 'DOGET-UNKNOWN-ERROR';
    }

    if (resultStatus !== null) {
      grunt.log.error(resultStatus + (stampConfirmed ? ': STAMP=OK' : ': STAMP=NOT-FOUND'));
      return false;
    }

    /*
     *  Check Jasmine-Report.
     */
    actual = resultText.match(/^\d+ spec(s*), \d+ failure(s*)/mg);
    if (actual === null) {
      grunt.log.error('JASMINE-INVALID-RESULT:');
      return false;
    }

    actual = actual[0].split(',');
    actual = {
      specs:    parseInt(actual[0], 10),
      failures: parseInt(actual[1], 10)
    };
    if (actual.failures !== 0) {
      if (expected === 'failure') {
        if (typeof opt !== 'undefined') {
          opt = parseInt(opt, 10);
          if (actual.failures !== opt) {
            grunt.log.error('JASMINE-ERROR: expected ' + opt + ' failures but ' + actual.failures + ' failures.');
            return false;
          }
        }
        return true;    // expect result to return failures.
      }
      grunt.log.error('JASMINE-FAILURE: expected pass but ' + actual.failures + ' failures.');
      return false;
    }

    if (expected === 'specs') {
      if (typeof opt !== 'undefined') {
        opt = parseInt(opt, 10);
        if (actual.specs !== opt) {
          grunt.log.error('JASMINE-ERROR: expected ' + opt + ' specs. but ' + actual.specs + ' specs.');
          return false;
        } else {
          return true;
        }
      } else {
        grunt.log.error('CHECKER-ERROR: number of specs expected is required.');
        return false;
      }
    }

    if (expected !== 'pass') {
      grunt.log.error('CHECKER-UNKNOWN-ERROR: result is expected ' + expected + '. but pass.');
      return false;
    }
    grunt.log.writeln('\n' );

    return true;
  });


  // sub tasks.

  grunt.registerTask('prepare', [
    'clean',
    'shell:mktmp',
    'shell:timestamp'
  ]);

  grunt.registerTask('local-test', 'rajah test/spec @ local', [
    'jshint',
    'shell:rajah:test/spec --noColor'
  ]);

  grunt.registerTask('remote-test', 'rajah test/spec @ remote', [

    'shell:rajah:test/spec' +
                ' --codegs -p package-rajah.json' +
                ' --stamp="<%= timestamp %>"' +
                ' -o tmp/remote-test-code.js',

    'shell:gas-upload:test-bench:tmp/remote-test-code.js',

    'shell:gas-wget:test-bench:tmp/test-wget.txt',

    'check-result:tmp/test-wget.txt:pass'
  ]);
  
  grunt.registerTask('package-build', 'Building project package.', [
    'shell:nml:package.json' +
              ' -o tmp/package.js'
  ]);

  grunt.registerTask('package-test', 'Upload project package and check.', [

    'shell:rajah:test/package' +
                ' --codegs -p package-rajah.json' +
                ' --stamp="<%= timestamp %>"' +
                ' -o tmp/package-test-spec.js',

    'shell:gas-upload:package-test-target:tmp/package.js',

    'shell:gas-upload:package-test-spec:tmp/package-test-spec.js',

    'shell:gas-wget:test-bench:tmp/package-test-wget.txt',

    'check-result:tmp/package-test-wget.txt:pass'
  ]);

  grunt.registerTask('package-upload', 'Upload project package to public gas-project.', [
    'shell:gas-upload:package-deploy:tmp/package.js'
  ]);

  grunt.registerTask('package-publish', 'publish project to npm.', [
  ]);
  
  // main tasks.

  grunt.registerTask('spec-test',    'Run all of spec testing.', ['prepare', 'local-test', 'remote-test']);

  grunt.registerTask('build',  'Build project package and test.', ['spec-test', 'package-build', 'package-test']);

  grunt.registerTask('deploy',  'Deploy project package after testing.', ['spec-test', 'package-build', 'package-test', 'package-upload']);

  grunt.registerTask('default', ['spec-test']);
};
