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
            'node_modules/babel-polyfill/dist/polyfill.js',
            'bower_components/tui-code-snippet/code-snippet.js',
            'bower_components/tui-dom/dist/tui-dom.js',
            'bower_components/tui-component-floatinglayer/dist/floatingLayer.js',
            'bower_components/tui-component-contextmenu/dist/tui-component-contextmenu.js',
            'bower_components/jquery/jquery.min.js',
            'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            'node_modules/jasmine-ajax/lib/mock-ajax.js',
            'test/preparation.js',
            'test/*.test.js',
            'src/**/*.js',
            {
                pattern: 'test/fixtures/**/*.html',
                included: false
            }
        ],

        exclude: [
            'test/ajax.test.js'
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
            'PhantomJS'
        ],

        singleRun: false
    });
};
