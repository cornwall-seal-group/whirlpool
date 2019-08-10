const Boom = require('boom');
const ProcessPPTS = require('../utils/process-ppts');

const processAlbum = request => {
    const { payload } = request;
    const { file } = payload;
    // Process PPT
    return ProcessPPTS.processPPT(file);
};

module.exports = {
    processAlbum
};
