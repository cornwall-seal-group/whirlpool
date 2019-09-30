const config = require('config');

const fs = require('fs');
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const { extractSealsFromSlides } = require('./process-images.js');

const baseSlideDir = `${config.pptProcessingDir}ppt/slides/`;

const convertNumberInFile = file => {
    const number = file.substr(5).split('.')[0];

    let formattedNum = number;

    if (number.length === 1) {
        formattedNum = `000${number}`;
    } else if (number.length === 2) {
        formattedNum = `00${number}`;
    } else if (number.length === 3) {
        formattedNum = `0${number}`;
    }

    return formattedNum;
};
// Loop through all the slide files
const renameSlides = () => {
    const files = fs.readdirSync(baseSlideDir);
    files.forEach(file => {
        const formattedNum = convertNumberInFile(file);
        const ext = 'xml';
        fs.renameSync(baseSlideDir + file, `${baseSlideDir}slide${formattedNum}.${ext}`);
    });
};

const processZipOfPPTs = file => {
    const filename = file.hapi.filename.replace(/\s+/g, '-');
    const data = file._data;
    console.log('Saving', filename);
    fs.writeFileSync(`${config.pptInputDir}${filename}`, data);

    console.log('About to process ZIP', filename);
    const sealsFoundAcrossAllPPTs = [];

    unzipRealZipFile(filename);
    moveZipFile(filename);

    //Remove the __macosx folder if it exists
    const removeMacFolderCommand = `sudo rm -rf ${config.pptInputDir}__macosx/`;
    execSync(removeMacFolderCommand);

    const removeMACFolderCommand = `sudo rm -rf ${config.pptInputDir}__MACOSX/`;
    execSync(removeMACFolderCommand);

    const removeDsStore = `sudo rm -rf ${config.pptInputDir}.DS_Store`;
    execSync(removeDsStore);

    const ppts = fs.readdirSync(config.pptInputDir);
    ppts.forEach(ppt => {
        const name = ppt
            .replace(/\s+/g, '-')
            .replace(/\(/g, '-')
            .replace(/\)/g, '-')
            .replace(/\'/g, '');
        fs.renameSync(`${config.pptInputDir + ppt}`, `${config.pptInputDir + name}`);
        const seals = processPPT(name);
        sealsFoundAcrossAllPPTs.push({ ...seals, ppt: name });
    });

    return sealsFoundAcrossAllPPTs;
};

const saveFileAndProcessPPT = file => {
    const filename = file.hapi.filename
        .replace(/\s+/g, '-')
        .replace(/\(/g, '-')
        .replace(/\)/g, '-')
        .replace(/\'/g, '');
    const data = file._data;
    console.log('Saving', filename);
    fs.writeFileSync(`${config.pptInputDir}${filename}`, data);

    return processPPT(filename);
};

const processPPT = filename => {
    console.log('About to process', filename);

    // Remove anything in processing Dir before starting
    rimraf.sync(config.pptProcessingDir);
    fs.mkdirSync(config.pptProcessingDir);

    // Zip then unzip the PPT
    zip(filename);
    unzip(filename);

    renameSlides();

    const imagePrefix = createImagePrefix(filename);
    const foundSeals = extractSealsFromSlides(imagePrefix);

    movePPTAfterProcess(filename);

    const folder = config.sealImagesOutputDir + '/albums/';
    fs.writeFileSync(folder + filename.replace('.pptx', '.json'), JSON.stringify(foundSeals));

    return foundSeals;
};

const createImagePrefix = filename => {
    const name = filename.replace('pptx', '');
    const regex = new RegExp(/\b[a-zA-Z]/g);
    const id = name.match(regex).join('');
    return name.substr(0, 10) + '_' + id;
};

const movePPTAfterProcess = filename => {
    const folder = config.sealImagesOutputDir + '/albums/';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    fs.renameSync(`${config.pptInputDir + filename}`, `${folder + filename}`);
};
const zip = filename => {
    const command = `cd ${config.pptInputDir} && cp ${filename} .${config.pptProcessingDir}${filename.replace(
        '.pptx',
        '.zip'
    )}`;
    console.log('About to zip', command);
    execSync(command);
};

const unzip = filename => {
    const command = `cd ${config.pptProcessingDir} && sudo unzip ${filename.replace('.pptx', '.zip')}`;
    console.log('About to unzip', command);
    execSync(command);
};

const unzipRealZipFile = filename => {
    const command = `cd ${config.pptInputDir} && sudo unzip ${filename}`;
    console.log('About to unzip', command);
    execSync(command);
};

const moveZipFile = filename => {
    const command = `cd ${config.pptInputDir} && sudo mv ${filename} .${config.zipDir}`;
    console.log(`About to move zip file ${filename}`, command);
    execSync(command);
};

module.exports = {
    saveFileAndProcessPPT,
    processZipOfPPTs
};
