const { merge } = require('webpack-merge');
const webpackConfiguration = require('../webpack.config');

module.exports = merge(webpackConfiguration, {
    mode: 'production',
    devtool: false,
    performance: {
        maxEntrypointSize: 1024000,
        maxAssetSize: 1024000,
    },
    plugins: [],
});
