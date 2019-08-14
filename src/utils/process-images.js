/*
Images Script

*/
const SealMappings = require('../../seal-mappings/mappings.json');
const config = require('config');
const fs = require('fs');
const parser = require('xml2json');
const findDuplicateFiles = require('find-duplicate-files');
const { execSync } = require('child_process');
const path = require('path');
const baseSlideDir = `${config.pptProcessingDir}ppt/slides/`;
const imageOutputDir = config.sealImagesOutputDir;

const knownTitles = ['re_ids', 'new_ids', 'new_id', 'new_matches', 'no_ids', 'taggies', 'netties', 'entangled'];
const SHORT_SEAL_NAME_POSTFIX = '-x';

let foundSeals = [];
let slideSeals = {};
const convertNumber = number => {
    number = number.toString();
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

// Loop through all the slide files - this will output all text; some are maybe wrong
const extractSlideText = () => {
    console.log(baseSlideDir);
    fs.readdir(baseSlideDir, (err, files) => {
        files.forEach(file => {
            console.log(file);
            fs.readFile(baseSlideDir + file, 'utf8', (err, data) => {
                if (!data) return;
                const json = JSON.parse(parser.toJson(data));
                console.log(data);
                try {
                    const title = json['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:txBody']['a:p']['a:r']['a:t'];

                    if (title.indexOf('is') > -1) {
                        console.warn(file, title);
                    }
                } catch (e) {}
            });
        });
    });
};

// Loop through all the slide files and output the title slides with slide number
const findTitleSlides = () => {
    let previousTitle = {};
    const files = fs.readdirSync(baseSlideDir);
    files.forEach((file, index) => {
        const filename = baseSlideDir + file;
        if (!fs.lstatSync(filename).isDirectory()) {
            const data = fs.readFileSync(filename, 'utf8');

            if (data && data.indexOf('p:pic') === -1) {
                try {
                    const regex = new RegExp(/<a:t>([\s\S]*?)<\/a:t>/g);
                    // Only accept slides that have 1 string of text - not an essay slide!
                    if (data.match(regex).length === 1) {
                        const foundTitle = regex.exec(data)[1];
                        const title = foundTitle
                            .toLowerCase()
                            .replace(/\s+/g, '_')
                            .replace(/-/g, '_');

                        if (Object.keys(previousTitle).length > 0) {
                            console.warn(previousTitle.title, ': from', previousTitle.index + 1, 'to', index - 1);
                        }
                        previousTitle = {
                            title,
                            index,
                            file
                        };
                    }
                } catch (e) {}
            }
        }
    });
    console.warn(previousTitle.title, ': from', previousTitle.index + 1, 'to', files.length - 1);
};

// Loop through all the slide files, find the titles and work out the slides
// in between. Then process each slide xml file to extract the images referenced
// in them. Fetch them and save them to the output folders
const extractSealsFromSlides = () => {
    let previousTitle = {};
    const categories = [];
    const files = fs.readdirSync(baseSlideDir);
    files.forEach((file, index) => {
        const filename = baseSlideDir + file;
        if (!fs.lstatSync(filename).isDirectory()) {
            const data = fs.readFileSync(filename, 'utf8');

            if (data && data.indexOf('p:pic') === -1) {
                try {
                    const regex = new RegExp(/<a:t>([\s\S]*?)<\/a:t>/g);
                    if (data.match(regex).length === 1) {
                        const foundTitle = regex.exec(data)[1];
                        const title = foundTitle
                            .toLowerCase()
                            .replace(/\s+/g, '_')
                            .replace(/-/g, '_');

                        if (Object.keys(previousTitle).length > 0) {
                            categories.push({
                                title: previousTitle.title,
                                start: previousTitle.index + 1,
                                end: index
                            });
                        }
                        previousTitle = { title, index, file };
                    }
                } catch (e) {}
            }
        }
    });

    categories.push({
        title: previousTitle.title,
        start: previousTitle.index + 1,
        end: files.length - 1
    });

    console.log(categories);
    categories.forEach(category => {
        getImagesForTheCategory(category);
    });

    removeDuplicateImagesFromFolders();
    removeDuplicateNoIdImages();
    reSyncMinio();

    return { processed: slideSeals };
};

const removeDuplicateImagesFromFolders = () => {
    foundSeals.forEach(seal => {
        let sealFolder = seal.toLowerCase();
        if (seal.length < 3) {
            sealFolder = sealFolder + SHORT_SEAL_NAME_POSTFIX;
        }
        const folder = imageOutputDir + sealFolder + '/originals';
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

const reSyncMinio = () => {
    if (config.syncMinio) {
        execSync(`${config.serverRoot}./mc mirror ${config.sealImagesOutputDir} myminio --overwrite`);
    }
};

const getImagesForTheCategory = ({ title, start, end }) => {
    // no_ids = create folder for unknowns, put all images in 'new-ids' folder for future matching
    if (title === 'no_ids') {
        parseNewSealSlides({ start, end });
    } else if (knownTitles.includes(title)) {
        // re_ids, new_ids, taggies, netties, new_matches

        // Find the seal name in the slide
        // Create a folder for that seal if not already exists
        // Go through the images in the slide and add to the folder

        parseKnownSealSlides({ start, end });
    } else {
        console.warn('Unknown title type', title, ', ignoring');
    }
};

const parseNewSealSlides = ({ start, end }) => {
    let index = 1;
    for (let i = start; i < end; i++) {
        // Create a folder for the new Ids
        const folder = `${imageOutputDir}no-ids`;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        } else {
            const files = fs.readdirSync(folder);
            index = files.length + 1;
        }

        parseSlideMetaForImages({ folder, id: 'new', i, index });
    }
};

const parseKnownSealSlides = ({ start, end }) => {
    // Read each slide res file and read the images found
    for (let i = start; i < end; i++) {
        let index = 1;

        const slide = fs.readFileSync(`${baseSlideDir}slide${convertNumber(i)}.xml`, 'utf8');

        // const sealNameRegex = new RegExp(/<a:t>([A-Z]*[0-9]*?)(\s)?<\/a:t>/g);
        // const sealNameRegex = new RegExp(/<a:t>((\s)?([A-Z]*(\d+)?)(\s)?)/g);
        const sealNameRegex = new RegExp(/<a:t>((\s)?([A-Z]{1,5}[\d]{1,5})(\s)?)/g);
        const sealNameInSlide = sealNameRegex.exec(slide);
        if (sealNameInSlide) {
            const seal = sealNameInSlide[1].trim();
            console.log('Slide', i, 'Seal name', seal);
            let masterSealName = seal;

            if (masterSealName.indexOf('JF') === 0 || masterSealName.indexOf('JM') === 0) {
                masterSealName = 'P' + masterSealName;
            }
            const mappedSeal = SealMappings[seal];
            if (mappedSeal && mappedSeal !== masterSealName) {
                masterSealName = SealMappings[seal];
                console.log('For', seal, 'master seal ID is actually', masterSealName);
            }

            slideSeals[seal] = masterSealName;
            foundSeals.push(masterSealName);

            let minioFolderName = masterSealName.toLowerCase();
            if (minioFolderName.length < 3) {
                minioFolderName = minioFolderName + SHORT_SEAL_NAME_POSTFIX;
            }

            // Create a folder for the seal
            const folder = imageOutputDir + minioFolderName + '/originals';
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            } else {
                const files = fs.readdirSync(folder);
                index = files.length + 1;
            }

            parseSlideMetaForImages({ folder, id: masterSealName, i, index });
        }
    }
};

const parseSlideMetaForImages = ({ folder, id, i, index }) => {
    const slideData = fs.readFileSync(`${baseSlideDir}slide.xml/slide${i}.xml.rels`, 'utf8');
    const regex = /Target="..\/media([\s\S]*?)"/g;
    while ((m = regex.exec(slideData)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        const image = m[0].replace('Target="../media/', '').replace('"', '');
        const file = `${config.pptProcessingDir}ppt/media/${image}`;

        if (fs.existsSync(file)) {
            const extDot = file.lastIndexOf('.');
            const ext = file.substr(extDot);
            const renamedImage = `${folder}/${id}-${index}${ext}`;
            fs.renameSync(file, renamedImage);
            console.log(i, index, id, file, renamedImage);

            index += 1;
        }
    }
};

module.exports = {
    extractSlideText,
    extractSealsFromSlides,
    findTitleSlides
};
