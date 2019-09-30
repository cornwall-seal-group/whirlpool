const fs = require('fs');
const config = require('config');
const { execSync } = require('child_process');
const findDuplicateFiles = require('find-duplicate-files');
const { getSealFolder } = require('./seal-naming');
const path = require('path');
const imageOutputDir = config.sealImagesOutputDir;
const { convertImageTypes } = config;

const unsupportedImageTypes = ['tiff', 'tif'];
const unsupportedFiles = ['emf', 'wdp'];

const removeUnsupportedTypesForSeal = ({ seal, hasOriginals = true }) => {
    const sealFolder = getSealFolder(seal);
    const folder = imageOutputDir + sealFolder + (hasOriginals ? '/originals' : '');

    const files = fs.readdirSync(folder);

    files.forEach(file => {
        const filePath = file.split('.');
        const filename = filePath[0];
        const ext = filePath[filePath.length - 1];
        const existingFilePath = path.join(folder, file);

        // Remove file if it is unsupported
        if (unsupportedFiles.includes(ext)) {
            console.log(file, `unsupported type ${ext}, removing`);
            fs.unlinkSync(existingFilePath);
        }

        // Rename file if it is unsupported type
        if (unsupportedImageTypes.includes(ext)) {
            console.log(file, 'unsupported file type, renaming to jpg');
            const newFilePath = path.join(folder, filename + '.jpg');
            const command = `convert ${existingFilePath} ${newFilePath}`;
            console.log('About to run', command, convertImageTypes);
            if (convertImageTypes) {
                execSync(command);
                // Remove old file
                fs.unlinkSync(existingFilePath);
            }
        }
    });
};
const handleUnsupportedImageTypes = foundSeals => {
    console.log('Checking for unsupported images types');
    foundSeals.forEach(seal => {
        removeUnsupportedTypesForSeal({ seal });
    });
    // Remove from no-ids folder too
    removeUnsupportedTypesForSeal({ seal: 'no-ids', hasOriginals: false });
};

const removeDuplicateImagesFromFolders = foundSeals => {
    console.log('Removing duplicates');
    foundSeals.forEach(seal => {
        const sealFolder = getSealFolder(seal);
        const folder = imageOutputDir + sealFolder + '/originals';

        findDuplicateFiles(
            folder,
            {
                silent: true,
                md5SkipSaving: true,
                md5SkipLoading: true
            },
            (err, groups) => {
                if (err) return console.error(err);

                groups.forEach(group => {
                    //Sort the files first to ensure number sequence remains
                    group = group.sort((a, b) => {
                        var nameA = parseInt(a.path.split(`${seal}-`)[1].split('.')[0]);
                        var nameB = parseInt(b.path.split(`${seal}-`)[1].split('.')[0]);
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }
                    });

                    // loop starts at index 1
                    // first item will be untouched
                    for (var i = 1; i < group.length; i++) {
                        fs.unlinkSync(group[i].path);
                    }
                });
            }
        );
    });
};

const removeDuplicateNoIdImages = () => {
    const folder = imageOutputDir + 'no-ids/originals';

    findDuplicateFiles(
        folder,
        {
            silent: true,
            md5SkipSaving: true,
            md5SkipLoading: true
        },
        (err, groups) => {
            if (err) return console.error(err);
            groups.forEach(group => {
                //Sort the files first to ensure number sequence remains
                group = group.sort((a, b) => {
                    var nameA = parseInt(a.path.split('-no-')[1].split('.')[0]);
                    var nameB = parseInt(b.path.split('-no-')[1].split('.')[0]);
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                });

                // loop starts at index 1
                // first item will be untouched
                for (var i = 1; i < group.length; i++) {
                    fs.unlinkSync(group[i].path);
                }
            });
        }
    );
};

module.exports = {
    removeDuplicateImagesFromFolders,
    removeDuplicateNoIdImages,
    handleUnsupportedImageTypes
};
