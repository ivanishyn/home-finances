
module.exports = function (grunt) {
  // Loading all tasks:
  require('load-grunt-tasks')(grunt);

  var pkg = require('./package'),
      klei = require('./klei'),
      modulename = klei.name || pkg.title || pkg.name;

  grunt.initConfig({
    pkg: pkg,
    modulename: modulename,

    /**
     * Source dirs
     */
    dirs: {
      src: 'src',
      app: 'src/app',
      api: 'src/api',
      styles: 'src/styles',
      dist: 'dist',
      temp: '.tmp'
    },

    
    /**
     * Banner for top of concatenated CSS and Javascript
     */
    meta: {
      banner: '/**\n' +
        ' * <%= modulename %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' *\n' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
        ' */\n'
    },

    /**
     * Clean up
     */
    clean: {
      dist: {
        files: [{
          src: [
            '<%= dirs.temp %>',
            '<%= dirs.dist %>'
          ]
        }]
      },
      temp: '<%= dirs.temp %>'
    },

    /**
     * Server
     */
    'express': {
      options: {
        port: 1337,
        open: false,
        livereload: false,
        // change this to '0.0.0.0' to access the server from outside
        hostname: '*'
      },
      livereload: {
        options: {
          livereload: 35729,
          serverreload: true,
          showStack: true,
          server: '<%= dirs.src %>/index.js',
          bases: [
            'bower_components',
            '<%= dirs.temp %>',
            '<%= dirs.app %>',
            '<%= dirs.dist %>'
          ]
        }
      },
      dist: {
        options: {
          open: true,
          server: '<%= dirs.src %>/index.js',
          bases: [
            'bower_components',
            '<%= dirs.dist %>'
          ]
        }
      }
    },

    /**
     * Watch files and do stuff
     */
    watch: {
      base: {
        files: ['<%= dirs.api %>/**/*.js'],
        tasks: ['newer:jshint:base', 'newer:jshint:api']
      },
      styles: {
        files: ['<%= dirs.styles %>/**/*.styl', '<%= dirs.app %>/**/*.styl'],
        tasks: ['newer:stylus', 'newer:csslint', 'injector:app', 'injector:styleguide']
      },
      styleguide: {
        files: ['<%= dirs.styles %>/styleguide.html'],
        tasks: ['copy:styleguide']
      },
      templates: {
        files: ['<%= dirs.app %>/**/*.html', '!<%= dirs.app %>/<%= modulename %>.html'],
        tasks: ['html2js:app', 'injector:app']
      },
      index: {
        files: ['<%= dirs.app %>/<%= modulename %>.html'],
        tasks: ['copy:index']
      },
      app: {
        files: ['<%= dirs.app %>/**/*.js', '!<%= dirs.app %>/**/*.spec.js'],
        tasks: ['injector:app', 'newer:jshint:app']
      },
    },

    
    concurrent: {
      livereload: {
        options: {
          logConcurrentOutput: true
        },
        tasks: [
          'watch',
          'express:livereload'
        ]
      }
    },

    
    /**
     * Compile Stylus to CSS
     */
    stylus: {
      options: {
        compress: false
      },
      base: {
        files: [{
          expand: true,
          cwd: '<%= dirs.styles %>',
          src: ['{,*/}*.styl', '!{,*/}_*.styl'],
          dest: '<%= dirs.temp %>/css',
          ext: '.css'
        }]
      },
      app: {
        files: [{
          expand: true,
          cwd: '<%= dirs.app %>',
          src: ['**/*.styl', '!**/_*.styl'],
          dest: '<%= dirs.temp %>/css',
          ext: '.css'
        }]
      }
    },

    /**
     * Lint CSS
     */
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      all: {
        files: [{
          expand: true,
          cwd: '<%= dirs.temp %>/css',
          src: ['**/*.css'],
          ext: '.css'
        }]
      }
    },

    /**
     * Minify CSS
     */
    cssmin: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          '<%= dirs.dist %>/<%= modulename %>.min.css': [ '<%= dirs.dist %>/<%= modulename %>.css' ]
        }
      }
    },

    /**
     * Minify HTML templates for dist
     */
    htmlmin: {
      dist: {
        options: {
          // removeCommentsFromCDATA: true,
          collapseWhitespace: true,
          removeEmptyAttributes: true,
          collapseBooleanAttributes: true
          // removeAttributeQuotes: true,
          // removeRedundantAttributes: true,
          // useShortDoctype: true,
          // removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= dirs.app %>',
          src: ['**/*.html', '!<%= modulename %>.html'],
          dest: '<%= dirs.temp %>'
        }]
      }
    },

    /**
     * Compile AngularJS html templates to Javascript and inject into $templateCache
     */
    html2js: {
      app: {
        options: {
          module: '<%= modulename %>Templates',
          base: '<%= dirs.app %>',
          rename: function (template) {
            return '/' + modulename + '/' + template;
          }
        },
        files: [{
          expand: true,
          cwd: '<%= dirs.app %>',
          src: ['**/*.html', '!<%= modulename %>.html'],
          dest: '<%= dirs.temp %>',
          rename: function () {
            return '<%= dirs.temp %>/<%= modulename %>Templates.js';
          }
        }]
      },
      dist: {
        options: {
          module: '<%= modulename %>Templates',
          base: '<%= dirs.temp %>',
          rename: function (template) {
            return '/' + modulename + '/' + template;
          }
        },
        files: [{
          expand: true,
          cwd: '<%= dirs.temp %>',
          src: ['**/*.html'],
          dest: '<%= dirs.temp %>',
          rename: function () {
            return '<%= dirs.temp %>/<%= modulename %>Templates.js';
          }
        }]
      }
    },

    /**
     * Dependency injection annotation for AngularJS modules
     */
    ngmin: {
      dist: {
        src: [ '<%= dirs.dist %>/<%= modulename %>.js' ],
        dest: '<%= dirs.dist %>/<%= modulename %>.annotated.js'
      }
    },

    /**
     * Minify Javascripts
     */
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        files: {
          '<%= dirs.dist %>/<%= modulename %>.min.js': [ '<%= dirs.dist %>/<%= modulename %>.annotated.js' ]
        }
      }
    },

    /**
     * The Karma configurations.
     */
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      unit: {
        background: true
      },
      continuous: {
        singleRun: true
      }
    },

    /**
     * Mocha Cli configuration
     */
    mochacli: {
      options: {
        reporter: 'spec',
        ui: 'bdd'
      },
      api_unit: ['<%= dirs.api %>/**/*.spec.js'],
      api_continuous: {
        options: {
          bail: true,
        },
        src: ['<%= dirs.api %>/**/*.spec.js']
      }
    },

    /**
     * The `injector` task injects all scripts/stylesheets into the `index.html` file
     */
    injector: {
      options: {
        destFile: '<%= dirs.app %>/<%= modulename %>.html'
      },
      styleguide: {
        options: {
          destFile: '<%= dirs.styles %>/styleguide.html'
        },
        files: [
          {src: ['bower.json']},
          {
            expand: true,
            cwd: '<%= dirs.temp %>',
            src: ['**/*.css']
          }
        ]
      },
      styleguideMin: {
        options: {
          min: true,
          destFile: '<%= dirs.styles %>/styleguide.html'
        },
        src: ['bower.json', '<%= dirs.dist %>/<%= modulename %>.min.css']
      },

      karmaconf: {
        options: {
          destFile: 'karma.conf.js',
          starttag: '/** injector **/',
          endtag: '/** endinjector **/',
          transform: function (file) { return '\'' + file.slice(1) + '\','; }
        },
        files: [
          {
            src: [
              'bower.json',
              'bower_components/angular-mocks/angular-mocks.js'
            ]
          },
          {
            expand: true,
            cwd: '<%= dirs.app %>',
            src: ['<%= modulename %>.js', '**/index.js', '**/*.js', '!**/*.spec.js']
          },
          {
            expand: true,
            cwd: '<%= dirs.temp %>',
            src: ['*.js']
          },
          {
            expand: true,
            cwd: '<%= dirs.app %>',
            src: ['**/*.spec.js']
          }
        ]
      },

      /**
       * Inject all needed files during development to not
       * have to wait for minification, concatination, etc.
       */
      app: {
        options: {
          ignorePath: ['<%= dirs.app %>', '<%= dirs.temp %>']
        },
        files: [
          {
            expand: true,
            cwd: '<%= dirs.app %>',
            src: ['<%= modulename %>.js', '**/index.js', '**/*.js', '!**/*.spec.js']
          },
          {
            expand: true,
            cwd: '<%= dirs.temp %>',
            src: ['*.js', '**/*.css']
          }
        ]
      },

      /**
       * Use concatenated and minified sources for dist mode
       */
      dist: {
        options: {
          min: true,
          ignorePath: 'dist'
        },
        src: [
          '<%= dirs.dist %>/<%= modulename %>.min.js',
          '<%= dirs.dist %>/<%= modulename %>.min.css'
        ]
      },

      bower: {
        options: {
          ignorePath: 'bower_components'
        },
        src: ['bower.json']
      },
      bowerMin: {
        options: {
          min: true,
          ignorePath: 'bower_components'
        },
        src: ['bower.json']
      }
    },

    copy: {
      index: {
        src: '<%= dirs.app %>/<%= modulename %>.html',
        dest: '<%= dirs.dist %>/index.html'
      },
      styleguide: {
        src: '<%= dirs.styles %>/styleguide.html',
        dest: '<%= dirs.dist %>/styleguide.html'
      }
    },

    /**
     * Concat all source files
     */
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      app: {
        src: [
          '<%= dirs.app %>/<%= modulename %>.js',
          '<%= dirs.app %>/**/index.js',
          '<%= dirs.app %>/**/*.js',
          '<%= dirs.temp %>/*.js',
          '!<%= dirs.app %>/**/*.spec.js'
        ],
        dest: '<%= dirs.dist %>/<%= modulename %>.js'
      },
      styles: {
        src: [
          '<%= dirs.temp %>/**/*.css'
        ],
        dest: '<%= dirs.dist %>/<%= modulename %>.css'
      }
    },
    

    /**
     * Lint Javascript
     */
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      base: [
        'Gruntfile.js'
      ],
      app: {
        options: {
          jshintrc: '<%= dirs.app %>/.jshintrc'
        },
        files: [{
          expand: true,
          cwd: '<%= dirs.app %>',
          src: ['<%= modulename %>.js', '**/index.js', '**/*.js'],
          dest: '<%= dirs.app %>'
        }]
      },
      api: [
        '<%= dirs.api %>/**/*.js'
      ]
    }
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['dist', 'express:dist', 'express-keepalive']);
    }
    grunt.task.run([
      'build',
      'concurrent:livereload'
    ]);
  });

  grunt.registerTask('test', ['build', 'injector:karmaconf', 'karma:continuous', 'mochacli:api_continuous']);

  grunt.registerTask('build', [
    'clean',
    'html2js:app',
    'stylus:base',
    'stylus:app',
    'csslint',
    'injector:styleguide',
    'copy:styleguide',
    'injector:bower',
    'injector:app',
    'copy:index'
  ]);

  grunt.registerTask('dist', [
    'clean',
    'htmlmin:dist',
    'html2js:dist',
    'concat:app',
    'stylus:base',
    'stylus:app',
    'csslint',
    'concat:styles',
    'cssmin',
    'injector:styleguideMin',
    'copy:styleguide',
    'ngmin',
    'uglify',
    'injector:bowerMin',
    'injector:dist',
    'copy:index'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'build'
  ]);
};
