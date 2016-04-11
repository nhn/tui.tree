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
            'bower_components/jquery/jquery.min.js',
            'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            'bower_components/tui-code-snippet/code-snippet.min.js',
            'test/**/*.js',
            'src/**/*.js',
            {
                pattern: 'test/fixtures/**/*.html',
                included: false
            }
        ],

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

        browserStack: {
            username: process.env.BROWSER_STACK_USERNAME,
            accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
            project: 'tui-component-tree'
        },

        // define browsers
        customLaunchers: {
            bs_ie7: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: 'XP',
                browser_version: '7.0',
                browser: 'ie'
            },
            bs_ie8: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: 'XP',
                browser_version: '8.0',
                browser: 'ie'
            },
            bs_ie9: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '9.0',
                browser: 'ie'
            },
            bs_ie10: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '10.0',
                browser: 'ie'
            },
            bs_ie11: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '7',
                browser_version: '11.0',
                browser: 'ie'
            },
            bs_edge: {
                base: 'BrowserStack',
                os: 'Windows',
                os_version: '10',
                browser: 'edge',
                browser_version: '12.0'
            },
            bs_chrome_mac: {
                base: 'BrowserStack',
                os: 'OS X',
                os_version: 'El Capitan',
                browser: 'chrome',
                browser_version: '47.0'
            },
            bs_firefox_mac: {
                base: 'BrowserStack',
                os: 'OS X',
                os_version: 'El Capitan',
                browser: 'firefox',
                browser_version: '43.0'
            }
        },

        browsers: [
            'bs_ie7',
            'bs_ie8',
            'bs_ie9',
            'bs_ie10',
            'bs_ie11',
            'bs_edge',
            'bs_chrome_mac',
            'bs_firefox_mac'
        ],

        singleRun: true
    });
};
