const config = require('config');

const fs = require('fs');
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const processImages = require('./process-images.js');

const baseSlideDir = `./${config.pptProcessingDir}/ppt/slides/`;

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

const processPPTs = file => {
    // Save file to pptInputDir
    const filename = new Date().getTime();
    fs.writeFileSync(`${config.pptInputDir}/${filename}.pptx`, file);

    const files = fs.readdirSync(config.pptInputDir);
    files.forEach(savedFile => {
        const name = savedFile.split('.')[0];
        processPPT(name);
    });
};

const processPPT = filename => {
    // Remove anything in processing Dir before starting
    rimraf.sync(config.pptProcessingDir);
    fs.mkdirSync(config.pptProcessingDir);

    // Zip then unzip the PPT
    zip(filename);
    unzip(filename);

    renameSlides();
    processImages.extractSealsFromSlides();

    fs.renameSync(`${config.pptInputDir + filename}.pptx`, `${config.pptProcessedDir + filename}.pptx`);
};

const zip = filename => {
    execSync(`cd ${config.pptInputDir} && cp '${filename}.pptx' .${config.pptProcessingDir}ppt.zip`);
};

const unzip = filename => {
    execSync(`cd ${config.pptProcessingDir} && unzip ${filename}.zip`);
};

module.exports = {
    processPPTs
};
