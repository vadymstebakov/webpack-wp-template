const path = require('path');
const environment = require('./configuration/environment');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const PhpManifestPlugin = require('webpack-php-manifest');
const SshWebpackPlugin = require('ssh-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;
const isStats = process.env.NODE_ENV === 'stats';
const isDeploy = process.env.DEPLOY === 'deploy';
const regexImages = /\.(png|jpe?g|svg|gif)$/i;

// Filename
const filename = (ext, name = '[name]') => (isDev ? `${name}.${ext}` : `${name}.[contenthash:5].min.${ext}`);

// Optimization
const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    name: 'vendors',
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    };

    if (isProd || isStats) {
        config.minimize = true;
        config.minimizer = [
            new TerserWebpackPlugin({
                parallel: true,
            }),
            new CssMinimizerPlugin({
                parallel: true,
                minimizerOptions: {
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true },
                        },
                    ],
                },
            }),
        ];
    }

    return config;
};

// SVG Sprite
const putSVGSprite = () => {
    return new HTMLWebpackPlugin({
        filename: 'images/symbol-sprite/symbol-sprite.html',
        template: './images/symbol-sprite/symbol-sprite.html',
        inject: false,
        minify: {
            collapseWhitespace: isProd,
        },
    });
};

// Deploy
const deploy = () => {
    return new SshWebpackPlugin({
        ...environment.deploy,
        from: environment.paths.output,
        cover: isDev,
    });
};

// Style loaders
const styleLoaders = () => {
    const loaders = [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
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
                postcssOptions: {
                    plugins: ['autoprefixer'],
                },
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

// Js loaders
const jsLoaders = () => {
    const loaders = [
        {
            loader: 'babel-loader',
            options: {
                babelrc: false,
                configFile: path.resolve(__dirname, 'babel.config.json'),
            },
        },
    ];

    if (isDev) {
        loaders.push('eslint-loader');
    }

    return loaders;
};

// Plugins
const plugins = () => {
    const base = [
        new MiniCssExtractPlugin({
            filename: `styles/${filename('css')}`,
        }),
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: environment.paths.images,
                    to: 'images/',
                    force: true,
                    toType: 'dir',
                    globOptions: {
                        ignore: ['*.DS_Store', 'Thumbs.db'],
                    },
                },
                {
                    from: environment.paths.fonts,
                    to: 'fonts/',
                    force: true,
                    toType: 'dir',
                    globOptions: {
                        ignore: ['*.DS_Store', 'Thumbs.db'],
                    },
                },
            ],
        }),
        putSVGSprite(),
        new ImageminPlugin({
            disable: isDev,
            test: regexImages,
            pngquant: {
                quality: '90-100',
            },
        }),
        new PhpManifestPlugin({
            ...environment.manifest,
        }),
    ];

    if (isStats) base.push(new BundleAnalyzerPlugin());
    if (isDeploy) base.push(deploy());

    return base;
};

// Modules of webpack
module.exports = {
    context: environment.paths.source,
    entry: {
        app: ['element-closest-polyfill', path.resolve(environment.paths.source, 'scripts', 'index.js')],
    },
    output: {
        filename: `scripts/${filename('js')}`,
        path: environment.paths.output,
    },
    optimization: optimization(),
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
    plugins: plugins(),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@scripts': path.resolve(__dirname, 'src/scripts'),
            '@helpers': path.resolve(__dirname, 'src/scripts/helpers'),
            '@components': path.resolve(__dirname, 'src/scripts/components'),
            '@assets': path.resolve(__dirname, 'src/assets'),
        },
    },
};
