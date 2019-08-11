const Boom = require('@hapi/boom');
const ProcessPPTS = require('../utils/process-ppts');
const Bcrypt = require('bcrypt');
const config = require('config');

const processAlbum = request => {
    const { payload } = request;
    const { file } = payload;
    const { headers } = request;

    const apiKey = headers['x-api-key'] || '';

    return new Promise(resolve => {
        const match = Bcrypt.compare(apiKey, config.apiKey).then(match => {
            if (match) {
                resolve(ProcessPPTS.processPPT(file));
            } else {
                resolve(Boom.unauthorized('Incorrect API Key'));
            }
        });
    });
};

module.exports = {
    processAlbum
};
