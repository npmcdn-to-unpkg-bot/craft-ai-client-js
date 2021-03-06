var dotenv = require('dotenv');
var webpack = require('webpack');

dotenv.load({
  silent: true,
  path: '../../.env'
});

module.exports = {
  entry: '!mocha!./test.js',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      __CRAFT_TOKEN__: JSON.stringify(process.env.CRAFT_TOKEN),
      __CRAFT_OWNER__: JSON.stringify(process.env.CRAFT_OWNER),
      __CRAFT_URL__: JSON.stringify(process.env.CRAFT_URL),
      __DEBUG__: JSON.stringify(process.env.DEBUG)
    })
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/,
        options: {
          cacheDirectory: true
        }
      },
      {
        test: /\.json$/,
        loaders: ['json-loader']
      }
    ]
  }
};
