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
    path: path.resolve(__dirname, 'public/scripts'),
    clean: true,
  },
  target: 'web',
  optimization: {
    minimize: false
  }
};