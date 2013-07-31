"use strict";


module.exports = function( grunt ) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            test: ['dist/**/*.js']
        },

        build: {
            // alone: {
            //     dest: 'dist/neuron-alone.js',
            //     src: [
            //         'lib/intro.js',
            //         'lib/ecma5.js',

            //         'lib/seed.js',
            //         'lib/lang.js',
                    
            //         'lib/event.js',
            //         'lib/module-manager.js',
            //         // 'lib/biz.js',
            //         'lib/outro.js'
            //     ]
            // }, 

            active: {
                dest: 'dist/neuron.js',
                src: [
                    "seed.js",
                    "lang/native.js",
                    "lang/enhance.js",
                    "lang/web.js",

                    "oop/class.js",
                    "oop/attrs.js",
                    "oop/events.js",

                    "selector/finder.js",
                    "selector/parser.js",
                    "selector/adapter.js",

                    "ua/ua.js",

                    "dom/dom.js",
                    "dom/feature.js",
                    "dom/event.js",
                    "dom/css.js",
                    "dom/traverse.js",
                    "dom/manipulate.js",
                    "dom/create.js",
                    "dom/domready.js",
                    
                    "loader/assets.js",
                    "loader/active.js",
                    "loader/active-config.js",
                    
                    "biz/biz.js",
                    "biz/hippo.js",

                    "cleaner.js"
                ]
            },

            // passive_timeout: {
            //     dest: 'dist/neuron-with-passive-config.js',
            //     src: [
            //         'lib/intro.js',
            //         'lib/ecma5.js',

            //         'lib/seed.js',
            //         'lib/lang.js',
                    
            //         'lib/event.js',
            //         'lib/module-manager.js',
            //         // 'lib/biz.js',
            //         'lib/loader/config-passive-timeout.js',
            //         'lib/outro.js'
            //     ]
            // },
        },

        jshint: {
            dist: {
                src: [ 'dist/neuron-alone.js' ],
                options: require('./grunt/jshint/dist-rc')
            },

            grunt: {
                src: [ 'Gruntfile.js' ],
                options: require('./grunt/jshint/grunt-rc')
            }
        },

        mocha: {
            all: ['test/*.html'],
            options: {
                reporter: 'Spec',
                run: false,
                ignoreLeaks: false,
                timeout:5000
            }
        },

        uglify: {
            all: {
                files: {
                    "dist/neuron.min.js": [ "dist/neuron.js" ]
                },
                options: {
                    // Keep our hard-coded banner
                    preserveComments: "some",
                    // sourceMap: "dist/neuron.min.map",
                    // sourceMappingURL: "neuron.min.map",
                    report: "gzip",
                    beautify: {
                        ascii_only: true
                    },
                    compress: {
                        hoist_funs: false,
                        join_vars: false,
                        loops: false,
                        unused: false
                    },
                    mangle: {
                        // saves some bytes when gzipped
                        except: [ "undefined" ]
                    }
                }
            }
        }
    });


    grunt.registerMultiTask(
        'build',
        'build files',
        function() {
            var version = grunt.config( 'pkg.version' );
            var data = this.data;
            var src = data.src;
            var dest = data.dest;
            var compiled;

            if ( process.env.COMMIT ) {
                version += '' + process.env.COMMIT;
            }

            compiled = src.reduce(function(compiled, filepath) {
                return compiled + grunt.file.read( filepath ) + '\n\n';

            }, '');


            // Embed Version
            // Embed Date
            compiled = compiled
                .replace( /@VERSION/g, version )
                .replace( /@DATE/g, function () {
                    // YYYY-MM-DD
                    return ( new Date() ).toISOString().replace( /T.*/, '' );
                });

            // Write concatenated source to file
            grunt.file.write( dest, compiled );

            // Fail task if errors were logged.
            if ( this.errorCount ) {
                return false;
            }

            // Otherwise, print a success message.
            grunt.log.writeln( 'File ' + dest + ' created.' );
        }

    );

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['clean', 'build', 'jshint', /* 'mocha' */, 'uglify']);

};