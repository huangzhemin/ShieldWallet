const path = require('path');

module.exports = {
  entry: {
    background: './src/background/index.ts',
    popup: './src/popup/index.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "assert": require.resolve("assert"),
      "url": require.resolve("url"),
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'scripts'),
    clean: true,
  },
  target: 'web',
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        }
      }
    }
  },
  performance: {
    hints: false,
    maxEntrypointSize: 5000000,
    maxAssetSize: 5000000
  }
};