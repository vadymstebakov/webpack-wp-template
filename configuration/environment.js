const path = require('path');
// const fs = require('fs');
// const dotenv = require('dotenv').config({ path: '../.env.local' });

module.exports = {
    paths: {
        source: path.resolve(__dirname, '../src/'),
        output: path.resolve(__dirname, '../dist/'),
        images: path.resolve(__dirname, '../src/images/'),
        fonts: path.resolve(__dirname, '../src/fonts/'),
    },
    deploy: {
        host: 'host',
        port: 'port',
        username: 'username',
        // privateKey: fs.readFileSync(dotenv.parsed.PATH_TO_SSH_KEY), // or password: 'password',
        // passphrase: 'passphrase',
        password: 'password',
        to: '/to',
    },
    manifest: {
        path: 'assets/',
        phpClassName: 'PathsToFiles',
    },
};
