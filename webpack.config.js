/**
 * Configs file for bundling
 * @author NHN. FE Development Lab <dl_javascript@nhn.com>
 */

var path = require('path');
var pkg = require('./package.json');
var webpack = require('webpack');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = function(env, argv) {
  var isProduction = argv.mode === 'production';
  var FILENAME = pkg.name + (isProduction ? '.min.js' : '.js');
  var BANNER = [
    'TOAST UI Tree',
    '@version ' + pkg.version,
    '@author ' + pkg.author,
    '@license ' + pkg.license
  ].join('\n');

  return {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
      library: ['tui', 'Tree'],
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'dist/',
      filename: FILENAME
    },
    externals: {
      'tui-code-snippet': {
        commonjs: 'tui-code-snippet',
        commonjs2: 'tui-code-snippet',
        amd: 'tui-code-snippet',
        root: ['tui', 'util']
      },
      'tui-context-menu': {
        commonjs: 'tui-context-menu',
        commonjs2: 'tui-context-menu',
        amd: 'tui-context-menu',
        root: ['tui', 'ContextMenu']
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(dist|node_modules|bower_components)/,
          loader: 'eslint-loader',
          enforce: 'pre',
          options: {
            failOnError: isProduction
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /[.png|.gif]$/,
          loader: 'url-loader'
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({filename: pkg.name + '.css'}),
      new webpack.BannerPlugin(BANNER)
    ],
    devServer: {
      historyApiFallback: false,
      progress: true,
      host: '0.0.0.0',
      disableHostCheck: true
    }
  };
};
