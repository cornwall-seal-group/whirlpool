const config = require('config');

const fs = require('fs');
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const processImages = require('./process-images.js');

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

const processPPT = file => {
    const filename = file.hapi.filename;

    console.log('Saving', filename);
    fs.writeFileSync(`${config.pptInputDir}${filename}.pptx`, file);

    console.log('About to process', filename);

    // Remove anything in processing Dir before starting
    rimraf.sync(config.pptProcessingDir);
    fs.mkdirSync(config.pptProcessingDir);

    // Zip then unzip the PPT
    zip(filename);
    unzip(filename);

    renameSlides();
    const foundSeals = processImages.extractSealsFromSlides();

    movePPTAfterProcess(filename);

    const folder = config.sealImagesOutputDir + '/albums/';
    fs.writeFileSync(folder + filename.replace('.pptx', '.json'), foundSeals);

    return foundSeals;
};

const movePPTAfterProcess = filename => {
    const folder = config.sealImagesOutputDir + '/albums/';
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    fs.renameSync(`${config.pptInputDir + filename}.pptx`, `${folder + filename}.pptx`);
};
const zip = filename => {
    console.log('About to zip', filename);
    execSync(`cd ${config.pptInputDir} && cp '${filename}.pptx' .${config.pptProcessingDir}${filename}.zip`);
};

const unzip = filename => {
    console.log('About to unzip', filename);
    execSync(`cd ${config.pptProcessingDir} && unzip ${filename}.zip`);
};

module.exports = {
    processPPT
};
