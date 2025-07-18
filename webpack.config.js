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