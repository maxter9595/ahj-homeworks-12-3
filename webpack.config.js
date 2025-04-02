const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const isWatchMode = process.argv.includes("--watch");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: '',
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "src/assets",
          to: "assets",
          globOptions: {
            ignore: ["**/*.DS_Store"],
          },
        },
        {
          from: "src/manifest.json",
          to: "manifest.json",
        },
      ],
    }),
    !isWatchMode
      ? new GenerateSW({
          swDest: "serviceWorker/sw.js",
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /\.css$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'css-cache',
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images",
                expiration: {
                  maxEntries: 20,
                },
              },
            },
            {
              urlPattern: /\/api\/news/,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 10,
              },
            },
          ],
        })
      : null,
  ].filter(Boolean),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [isWatchMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "assets/images/[name][ext]",
        },
      },
      {
        test: /\.json$/,
        type: "javascript/auto",
      },
    ],
  },
  devServer: {
    proxy: {
      "/api": {
        target:  process.env.API_URL || "https://ahj-homeworks-12-3.onrender.com", 
        changeOrigin: true,
      },
    },
    hot: true,
    liveReload: false,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
      logging: "error",
    },
    devMiddleware: {
      writeToDisk: true,
    },
    static: {
      directory: path.join(__dirname, "dist"),
      watch: {
        ignored: /serviceWorker/,
      },
    },
    historyApiFallback: true,
  },
};
