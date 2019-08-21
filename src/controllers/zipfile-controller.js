const Boom = require('@hapi/boom');
const ProcessZip = require('../utils/process-zip');
const Bcrypt = require('bcrypt');
const config = require('config');

const process = request => {
    const { payload } = request;
    const { file } = payload;
    const { headers } = request;

    const apiKey = headers['x-api-key'] || '';

    return new Promise(resolve => {
        Bcrypt.compare(apiKey, config.apiKey).then(match => {
            if (match) {
                resolve(ProcessZip.process(file));
            } else {
                resolve(Boom.unauthorized('Incorrect API Key'));
            }
        });
    });
};

module.exports = {
    process
};
