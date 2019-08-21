/*
Images Script

*/
const SealMappings = require('../../seal-mappings/mappings.json');
const SHORT_SEAL_NAME_POSTFIX = '-x';

const getMasterSealName = seal => {
    let masterSealName = seal;

    if (masterSealName.indexOf('JF') === 0 || masterSealName.indexOf('JM') === 0) {
        masterSealName = 'P' + masterSealName;
    }
    const mappedSeal = SealMappings[seal];
    if (mappedSeal && mappedSeal !== masterSealName) {
        masterSealName = SealMappings[seal];
        console.log('For', seal, 'master seal ID is actually', masterSealName);
    }
    return masterSealName.toUpperCase();
};

const getSealFolder = seal => {
    let name = seal;
    if (name.length < 3) {
        name = seal + SHORT_SEAL_NAME_POSTFIX;
    }

    return name.toLowerCase();
};

const createSealImageName = ({ folder, file, id, index }) => {
    const extDot = file.lastIndexOf('.');
    const ext = file.substr(extDot);
    return `${folder}/${id}-${index}${ext}`;
};

module.exports = {
    getSealFolder,
    getMasterSealName,
    createSealImageName
};
