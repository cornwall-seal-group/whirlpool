/*
Images Script

*/
const config = require('config');
const { execSync } = require('child_process');

const reSyncMinio = () => {
    if (config.syncMinio) {
        execSync(`${config.serverRoot}./mc mirror ${config.sealImagesOutputDir} myminio --overwrite`);
    }
};

module.exports = {
    reSyncMinio
};
