const path = require('path');
const fs = require('fs');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const autoprefixer = require('autoprefixer');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const PhpManifestPlugin = require('webpack-php-manifest');
const SshWebpackPlugin = require('ssh-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
const isDeploy = process.env.DEPLOY === 'deployment';
const regexImages = /\.(png|jpe?g|svg|gif)$/i;

// Optimization
const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all',
        },
    };

    if (isProd) {
        config.minimizer = [new OptimizeCssAssetWebpackPlugin(), new TerserWebpackPlugin()];
    }

    return config;
};

// Deploy
const deploy = () => {
    return new SshWebpackPlugin({
        host: 'host',
        port: '22',
        username: 'username',
        privateKey: fs.readFileSync('/home/vadym/.ssh/rd-blog'),
        passphrase: 'passphrase',
        cover: isDev,
        from: path.resolve(__dirname, 'dist'),
        to: '/home/vijay/apps/wordpress/htdocs/wp-content/themes/resumedone/assets',
    });
};

// Style loaders
const styleLoaders = () => {
    const loaders = [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
                hmr: isDev,
                reloadAll: true,
                publicPath: '../',
            },
        },
        {
            loader: 'css-loader',
            options: {
                sourceMap: isDev,
            },
        },
        {
            loader: 'postcss-loader',
            options: {
                plugins: [autoprefixer()],
                sourceMap: isDev,
            },
        },
        {
            loader: 'sass-loader',
            options: {
                sourceMap: isDev,
            },
        },
    ];

    return loaders;
};

// File loaders
const fileLoaders = () => {
    const loaders = [
        {
            loader: 'file-loader',
            options: {
                esModule: false,
                name: '[path][name].[ext]',
            },
        },
    ];

    return loaders;
};

// Babel options
const babelOptions = preset => {
    const opts = {
        presets: ['@babel/preset-env'],
    };

    if (preset) opts.presets.push(preset);

    return opts;
};

// Js loaders
const jsLoaders = () => {
    const loaders = [
        {
            loader: 'babel-loader',
            options: babelOptions(),
        },
    ];

    if (isDev) {
        loaders.push('eslint-loader');
    }

    return loaders;
};

// Filename
const filename = ext => (isDev ? `[name].${ext}` : `[name].[hash].min.${ext}`);

// Plugins
const plugins = () => {
    const base = [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, 'src/images/**/**.*'),
                to: path.resolve(__dirname, 'dist'),
            },
        ]),
        new MiniCssExtractPlugin({
            filename: `styles/${filename('css')}`,
        }),
        new ImageminPlugin({
            disable: isDev,
            test: regexImages,
            pngquant: {
                quality: '95-100',
            },
        }),
        new PhpManifestPlugin({
            // NOTE: Will write path to your 'dist' directory
            path: '/assets/',
            phpClassName: 'PathsToFiles',
            // NOTE: You have to replace your paths to files (namely this symbol "\"), from "\" to "/" (use PHP method "str_replace")
        }),
    ];

    if (isProd) base.push(new BundleAnalyzerPlugin());
    if (isDeploy) base.push(deploy());

    return base;
};

// Webpack's module
module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
        main: ['@babel/polyfill', 'element-closest-polyfill', './scripts/index.js'],
    },
    output: {
        filename: `scripts/${filename('js')}`,
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: optimization(),
    devtool: isDev ? 'source-map' : '',
    plugins: plugins(),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: /scripts/,
                use: jsLoaders(),
            },
            {
                test: /\.scss$/i,
                include: /styles/,
                use: styleLoaders(),
            },
            {
                test: regexImages,
                include: /images/,
                use: fileLoaders(),
            },
            {
                test: /\.(ttf|eot|woff2|woff|svg)$/i,
                include: /fonts/,
                use: fileLoaders(),
            },
        ],
    },
};
