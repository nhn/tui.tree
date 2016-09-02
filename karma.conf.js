module.exports = function(config) {
    config.set({
        basePath: './',

        frameworks: ['browserify', 'jasmine'],

        reporters: [
            'dots',
            'coverage',
            'junit'
        ],

        files: [
            {
                pattern: 'bower_components/tui-code-snippet/code-snippet.js',
                watched: false
            },
            {
                pattern: 'bower_components/tui-domutil/domutil.js',
                watched: false
            },
            {
                pattern: 'bower_components/tui-component-floatinglayer/floatinglayer.js',
                watched: false
            },
            {
                pattern: 'bower_components/tui-component-contextmenu/contextmenu.js',
                watched: false
            },
            'bower_components/jquery/jquery.min.js',
            'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            'test/preparation.js',
            'test/*.test.js',
            'src/**/*.js',
            {
                pattern: 'test/fixtures/*.html',
                included: false
            },
            {
                pattern: 'test/fixtures/*.json',
                included: false
            }
        ],

        proxies: {
            '/': '/base/test/fixtures/'
        },

        exclude: [
        ],

        preprocessors: {
            'src/**/*.js': ['browserify', 'coverage'],
            'test/**/*.js': ['browserify']
        },

        coverageReporter: {
            dir: 'report/coverage/',
            reporters: [
                {
                    type: 'html',
                    subdir: function(browser) {
                        return 'report-html/' + browser;
                    }
                },
                {
                    type: 'cobertura',
                    subdir: function(browser) {
                        return 'report-cobertura/' + browser;
                    },
                    file: 'cobertura.txt'
                }
            ]
        },

        junitReporter: {
            outputDir: 'report',
            outputFile: 'report/junit-result.xml',
            suite: ''
        },

        browserify: {
            debug: true
        },

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        autoWatch: true,

        browsers: [
            'Chrome'
        ],

        singleRun: false
    });
};
