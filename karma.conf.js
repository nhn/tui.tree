module.exports = function(config) {
    var webdriverConfig = {
        hostname: 'fe.nhnent.com',
        port: 4444,
        remoteHost: true
    };

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        // karma runner 의 웹 서버 root를 변경할 수 있음
        basePath: './',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        reporters: [
            'dots',
            'coverage',
            'junit'
        ],
        /*
         karma runner 의 웹 서버에 포함될 파일들을 적어주세요.

         included: false 가 아닌 항목은 전부 자동으로 테스트 페이지에 include 됩니다.

         테스트 코드 파일들은 전부 포함되어야 합니다.
         files: [
            'lib/jquery/jquery.js', // JS 추가
            'src/css/test.css',     // CSS 추가
            { pattern: 'test/app/model/*.test.js', included: false }    // 웹서버에 포함은 하지만 테스트 페이지에 include안함
            { pattern: 'test/fixtures/*.html', included: false }        // 웹서버에 올라가지만 jasmine.loadFixture 로 쓸것이므로 include안함.
         ]
         */
        files: [
            'bower_components/jquery/jquery.js',
            'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
            'src/common/common.js',
            'src/js/tree.js',
            'src/**/treemodel.js',
            'test/*Test.js',
            {
                pattern: 'test/fixture/**/*.html',
                included: false
            }
        ],



        /*
         무시할 파일들

         특정 테스트를 제외하고 수행할 때 유용합니다.
         */
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/js/*.js': ['coverage']
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        coverageReporter: {
            dir : 'report/coverage/',
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
            outputFile: 'report/junit-result.xml',
            suite: ''
        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [
            'IE7',
            'IE8',
            'IE9',
            'IE10',
            'IE11',
            'Chrome-WebDriver',
            'Firefox-WebDriver'
        ],


        /*
         사용가능한 테스트 브라우저 목록

         추가를 원하시면 말씀주세요
         */
        customLaunchers: {
            'IE7': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'IE7'
            },
            'IE8': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'IE8'
            },
            'IE9': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'IE9'
            },
            'IE10': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'IE10'
            },
            'IE11': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'IE11'
            },
            'Chrome-WebDriver': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'chrome'
            },
            'Firefox-WebDriver': {
                base: 'WebDriver',
                config: webdriverConfig,
                browserName: 'firefox'
            }
        },


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};
