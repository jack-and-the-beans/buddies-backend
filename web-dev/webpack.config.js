const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./index.ts",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, '../web-output'),
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
  devServer: {
    contentBase: '../web-output'
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  externals: {
    firebase: "firebase",
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Buddies",
      hash: true,
      template: "index.html"
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: "defer"
    }),
  ],
};
