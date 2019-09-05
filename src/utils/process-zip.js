const config = require('config');
const fs = require('fs');
const { execSync } = require('child_process');
const { getMasterSealName, getSealFolder, createSealImageName } = require('./seal-naming');
const { removeDuplicateImagesFromFolders } = require('./image-helpers');

const saveUploadedSealImages = zipFolder => {
    let uploadedSeals = {};
    const baseFolder = `${config.zipDir}${zipFolder}/`;
    const folders = fs.readdirSync(baseFolder);
    const { sealImagesOutputDir } = config;

    folders.forEach(folder => {
        console.log('Processing', folder);
        const masterSealName = getMasterSealName(folder);
        const sealFolderName = getSealFolder(masterSealName);
        const originalSealFolder = `${baseFolder}${folder}/`;
        const files = fs.readdirSync(originalSealFolder);
        const sealOutputFolder = sealImagesOutputDir + sealFolderName + '/originals/';
        if (!fs.existsSync(sealOutputFolder)) {
            fs.mkdirSync(sealOutputFolder, { recursive: true });
        }

        const outputFolderFiles = fs.readdirSync(sealOutputFolder);
        const initialIndex = outputFolderFiles.length + 1;
        let index = initialIndex;
        files.forEach(file => {
            const renamedImage = createSealImageName({ id: masterSealName, folder: sealOutputFolder, file, index });
            fs.renameSync(`${originalSealFolder}${file}`, renamedImage);
            index += 1;
        });

        uploadedSeals[masterSealName] = index - initialIndex;
    });

    return uploadedSeals;
};

const process = file => {
    console.log('About to process zip file');

    const fileData = file._data;
    const filename = new Date().getTime();
    console.log('Saving', filename);

    // Make a new folder in the zipDir folder for the unzipped files
    fs.mkdirSync(`${config.zipDir}${filename}/`, { recursive: true });

    // Save Zip to root folder with Date as name
    const zippedFilename = `${filename}.zip`;
    fs.writeFileSync(`${config.zipDir}${zippedFilename}`, fileData);

    // Unzip contents to new folder
    unzip({ filename, zippedFilename });

    //Remove the __macosx folder if it exists
    const removeMacFolderCommand = `rm -rf ${config.zipDir}${filename}/__macosx/`;
    execSync(removeMacFolderCommand);

    const removeMACFolderCommand = `rm -rf ${config.zipDir}${filename}/__MACOSX/`;
    execSync(removeMACFolderCommand);

    // Loop through each folder found, match against the master seal name and copy to output folder
    const uploadedSeals = saveUploadedSealImages(filename);
    const data = {
        zippedFilename,
        uploadedSeals
    };

    moveZipAfterProcess(filename);
    createJsonOfData({ filename, data });
    console.log(Object.keys(uploadedSeals));
    removeDuplicateImagesFromFolders(Object.keys(uploadedSeals));

    return data;
};

const createJsonOfData = ({ filename, data }) => {
    const zipOutputfolder = config.sealImagesOutputDir + 'zipfiles/';
    fs.writeFileSync(zipOutputfolder + filename + '.json', JSON.stringify(data));
};

const moveZipAfterProcess = filename => {
    const folder = config.sealImagesOutputDir + 'zipfiles/';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    fs.renameSync(`${config.zipDir + filename}.zip`, `${folder + filename}`);
};

const unzip = ({ filename, zippedFilename }) => {
    const command = `cd ${config.zipDir} && unzip ${zippedFilename} -d ./${filename}`;
    console.log('About to unzip', command);
    execSync(command);

    return `${config.zipDir}${filename}`;
};

module.exports = {
    process,
    unzip
};
