/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const Boom = require('boom');
const ProcessPPTS = require('../utils/process-ppts');

const processCatalogue = request => {
    const { payload } = request;
    const { file } = payload;
    // Process PPT
    ProcessPPTS.processPPTs(file);
};

module.exports = {
    processCatalogue
};
