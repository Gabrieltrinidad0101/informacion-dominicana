import webpack from 'webpack';
import dotenv from 'dotenv';
dotenv.config();

export default function customWebpackPlugin() {
  return {
    name: 'custom-webpack-plugin',
    configureWebpack(config, isServer, utils) {
      return {
        plugins: [
          new webpack.IgnorePlugin({
            resourceRegExp: /\.(node|bin|wasm|dat|exe|png|jpg|mp3|mp4|zip)$/i,
          }),
          new webpack.DefinePlugin({
            'process.env.REACT_APP_SERVER_URL': JSON.stringify(process.env.REACT_APP_SERVER_URL || 'http://localhost:5500/data'),
            'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://informacion-dominicana-events-j3tbhk-08ef2c-185-188-249-178.traefik.me/events'),
            'process.env.REACT_APP_PUBLISHABLE_KEY': JSON.stringify(process.env.REACT_APP_PUBLISHABLE_KEY),
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
