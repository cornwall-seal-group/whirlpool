const fs = require('fs');
const config = require('config');
const { execSync } = require('child_process');
const findDuplicateFiles = require('find-duplicate-files');
const { getSealFolder } = require('./seal-naming');
const path = require('path');
const imageOutputDir = config.sealImagesOutputDir;

const unsupportedImageTypes = ['tiff', 'tif'];
const unsupportedFiles = ['emf', 'wdp'];

const removeUnsupportedTypesForSeal = ({ seal, hasOriginals = true }) => {
    const sealFolder = getSealFolder(seal);
    const folder = imageOutputDir + sealFolder + (hasOriginals ? '/originals' : '');
    console.log('Checking for unsupported images types in', folder);

    const files = fs.readdirSync(folder);

    files.forEach(file => {
        const filePath = file.split('.');
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
            const newFilePath = folder + filePath + '.jpg';
            console.log('About to run', `convert ${existingFilePath} ${newFilePath}`);
            execSync(`convert ${existingFilePath} ${newFilePath}`);
            // Remove old file
            fs.unlinkSync(existingFilePath);
        }
    });
};
const handleUnsupportedImageTypes = foundSeals => {
    foundSeals.forEach(seal => {
        removeUnsupportedTypesForSeal({ seal });
    });
    // Remove from no-ids folder too
    removeUnsupportedTypesForSeal({ seal: 'no-ids', hasOriginals: false });
};

const removeDuplicateImagesFromFolders = foundSeals => {
    foundSeals.forEach(seal => {
        const sealFolder = getSealFolder(seal);
        const folder = imageOutputDir + sealFolder + '/originals';
        console.log('Removing duplicates from', folder);
        findDuplicateFiles(
            folder,
            {
                silent: true,
                md5SkipSaving: true,
                md5SkipLoading: true
            },
            function(err, groups) {
                if (err) return console.error(err);
                groups.forEach(function(group) {
                    // loop starts at index 1
                    // first item will be untouched
                    for (var i = 1; i < group.length; i++) {
                        fs.unlinkSync(group[i].path);
                    }
                });
            }
        );

        //Now re-number the images in the folder so they are 1-*
        const files = fs.readdirSync(folder);

        files.forEach((file, index) => {
            const filePath = file.split('.');
            const ext = filePath[filePath.length - 1];
            const formattedNum = index + 1;

            const existingFilePath = path.join(folder, file);
            const newFilePath = path.join(folder, seal + '-' + formattedNum.toString() + '.' + ext);

            fs.renameSync(existingFilePath, newFilePath);
        });
    });
};

const removeDuplicateNoIdImages = () => {
    const folder = imageOutputDir + 'no-ids';
    findDuplicateFiles(
        folder,
        {
            silent: true,
            md5SkipSaving: true,
            md5SkipLoading: true
        },
        function(err, groups) {
            if (err) return console.error(err);
            groups.forEach(function(group) {
                // loop starts at index 1
                // first item will be untouched
                for (var i = 1; i < group.length; i++) {
                    fs.unlinkSync(group[i].path);
                }
            });
        }
    );

    //Now re-number the images in the folder so they are 1-*
    const files = fs.readdirSync(folder);

    files.forEach((file, index) => {
        const filePath = file.split('.');
        const ext = filePath[filePath.length - 1];
        const formattedNum = index + 1;

        const existingFilePath = path.join(folder, file);
        const newFilePath = path.join(folder, 'new-' + formattedNum.toString() + '.' + ext);

        fs.renameSync(existingFilePath, newFilePath);
    });
};

module.exports = {
    removeDuplicateImagesFromFolders,
    removeDuplicateNoIdImages,
    handleUnsupportedImageTypes
};
