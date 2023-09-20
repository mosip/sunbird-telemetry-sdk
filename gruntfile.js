const fs = require('fs');
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        version: '3.2.',
        karma: {
            telemetryV3: {
                configFile: './js/test/karma.renderer.config.js',
            },
            telemetryFunV3: {
                configFile: './js/test/karma.telemetry.fun.config.js',
            }

        },
        concat: {
            telemetryLib: {
                src: [
                    './js/libs/ajv.min.js',
                    './js/schema/telemetry-spec.js',
                    './js/libs/detectClient.js',
                    './js/libs/md5.js',
                    './js/libs/ua-parser.min.js',
                    './js/libs/fingerprint2.min.js',
                    './js/core/telemetryV3Interface.js',
                    './js/core/telemetrySyncManager.js',
                ],
                dest: './index.js'
            }
        },
        uglify: {
            authtokengenerator: {
                options: {
                    mangle: false
                },
                files: {
                    './js/core/auth-token-generator.min.js': ['./js/core/auth-token-generator/auth-token-generator.js']
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('build-telemetry-lib', ['concat:telemetryLib', "uglify:authtokengenerator"]);
    grunt.registerTask('renderer-telemetryV3', ['karma:telemetryV3']);
    grunt.registerTask('telemetry-lib-test', ['karma:telemetryFunV3']);

};