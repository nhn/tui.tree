/**
 * Configs file for bundling
 * @author NHN Ent. FE Development Lab <dl_javascript@nhnent.com>
 */
var pkg = require('./package.json');
var webpack = require('webpack');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var SafeUmdPlugin = require('safe-umd-webpack-plugin');

var isProduction = process.argv.indexOf('-p') > -1;

var FILENAME = pkg.name + (isProduction ? '.min.js' : '.js');
var BANNER = [
    FILENAME,
    '@version ' + pkg.version,
    '@author ' + pkg.author,
    '@license ' + pkg.license
].join('\n');

module.exports = {
    eslint: {
        failOnError: isProduction
    },
    entry: './src/js/index.js',
    output: {
        library: ['tui', 'Tree'],
        libraryTarget: 'umd',
        path: 'dist',
        publicPath: 'dist',
        filename: FILENAME
    },
    externals: {
        'tui-code-snippet': {
            'commonjs': 'tui-code-snippet',
            'commonjs2': 'tui-code-snippet',
            'amd': 'tui-code-snippet',
            'root': ['tui', 'util']
        },
        'tui-context-menu': {
            'commonjs': 'tui-context-menu',
            'commonjs2': 'tui-context-menu',
            'amd': 'tui-context-menu',
            'root': ['tui', 'ContextMenu']
        }
    },
    module: {
        preLoaders: [
            {
                test: /\.js$/,
                exclude: /(dist|node_modules|bower_components)/,
                loader: 'eslint-loader'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            },
            {
                test: /[.png|.gif]$/,
                loader: 'url-loader'
            }
        ]
    },
    plugins: [
        new SafeUmdPlugin(),
        new ExtractTextPlugin(pkg.name + '.css'),
        new webpack.BannerPlugin(BANNER)
    ],
    devServer: {
        historyApiFallback: false,
        progress: true,
        host: '0.0.0.0',
        disableHostCheck: true
    }
};
