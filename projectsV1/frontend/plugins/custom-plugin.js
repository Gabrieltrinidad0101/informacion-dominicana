import webpack from 'webpack';
import dotenv from 'dotenv';
dotenv.config();

export default function customWebpackPlugin() {
  return {
    name: 'custom-webpack-plugin',
    configureWebpack(config, isServer, utils) {
      return {
        plugins: [
          // Ignora archivos binarios problemáticos
          new webpack.IgnorePlugin({
            resourceRegExp: /\.(node|bin|wasm|dat|exe|png|jpg|mp3|mp4|zip)$/i,
          }),
          new webpack.DefinePlugin({
            'process.env.REACT_APP_SERVER_URL': JSON.stringify(process.env.REACT_APP_SERVER_URL || 'http://localhost:4000'),
            'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://127.0.0.1:3001/events'),
        }),
        ],
        resolve: {
          fallback: {
            fs: false,
            path: false,
            os: false,
          },
        },
      };
    },
  };
}
