var path = require('path');
var pkg = require('./package.json');
var webpack = require('webpack');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

function getOptimization(isMinified) {
  if (isMinified) {
    return {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: false,
          extractComments: false
        }),
        new OptimizeCSSAssetsPlugin()
      ]
    };
  }

  return {
    minimize: false
  };
}

module.exports = function(env, argv) {
  var isProduction = argv.mode === 'production';
  var isMinified = !!argv.minify;
  var FILENAME = pkg.name + (isMinified ? '.min' : '');
  var BANNER = ['TOAST UI Tree', '@version ' + pkg.version, '@license ' + pkg.license].join('\n');

  return {
    mode: 'development',
    entry: './src/js/index.js',
    output: {
      library: ['tui', 'Tree'],
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'dist/',
      filename: FILENAME + '.js'
    },
    externals: {
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
          exclude: /(dist|node_modules)/,
          loader: 'eslint-loader',
          enforce: 'pre',
          options: {
            failOnError: isProduction
          }
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
        {
          test: /[.png|.gif]$/,
          loader: 'url-loader'
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: FILENAME + '.css' }),
      new webpack.BannerPlugin(BANNER)
    ],
    optimization: getOptimization(isMinified),
    devServer: {
      historyApiFallback: false,
      progress: true,
      host: '0.0.0.0',
      disableHostCheck: true
    }
  };
};
