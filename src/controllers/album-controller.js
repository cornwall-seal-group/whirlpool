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
        Bcrypt.compare(apiKey, config.apiKey).then(match => {
            if (match) {
                resolve(ProcessPPTS.saveFileAndProcessPPT(file));
            } else {
                resolve(Boom.unauthorized('Incorrect API Key'));
            }
        });
    });
};

const processBulkAlbum = request => {
    const { payload } = request;
    const { file } = payload;
    const { headers } = request;

    const apiKey = headers['x-api-key'] || '';

    // save zip to input folder
    // unzip
    // loop through all files in unzipped folder and process ppt
    // move ppts to output folder
    return new Promise(resolve => {
        Bcrypt.compare(apiKey, config.apiKey).then(match => {
            if (match) {
                resolve(ProcessPPTS.processZipOfPPTs(file));
            } else {
                resolve(Boom.unauthorized('Incorrect API Key'));
            }
        });
    });
};

module.exports = {
    processAlbum,
    processBulkAlbum
};
