/*
Images Script

*/
const config = require('config');
const fs = require('fs');
const parser = require('xml2json');
const baseSlideDir = `${config.pptProcessingDir}ppt/slides/`;
const imageOutputDir = config.sealImagesOutputDir;
const { getMasterSealName, getSealFolder, createSealImageName } = require('./seal-naming');
const {
    removeDuplicateImagesFromFolders,
    removeDuplicateNoIdImages,
    handleUnsupportedImageTypes
} = require('./image-helpers');
const knownTitles = [
    're_id',
    're_ids',
    'new_ids',
    'new_id',
    'new_matches',
    'new_match_up',
    'no_ids',
    'taggies',
    'taggie',
    'netties',
    'nettie',
    'entangled',
    'injured',
    'snotty',
    'mutton_cove',
    'rocks_off_mutton',
    'rocks_off_mutton_cove',
    'kates_island',
    'godrevy_island',
    'left_of_lighthouse',
    'right_of_lighthouse',
    'under_lighthouse',
    'left_ledges',
    'far_left_ledges',
    'right_ledges',
    'far_right_ledges',
    'kynance_cove',
    'hudder_cove',
    'hells_mouth',
    'castle_giver'
];

let foundSeals = [];
let slideSeals = {};
let imagePrefix = '';

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
                            .trim()
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
const extractSealsFromSlides = prefix => {
    imagePrefix = prefix;
    slideSeals = {};
    foundSeals = [];

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
                            .trim()
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

    handleUnsupportedImageTypes(foundSeals);
    removeDuplicateImagesFromFolders(foundSeals);
    removeDuplicateNoIdImages();

    return { processed: slideSeals };
};

const getImagesForTheCategory = ({ title, start, end }) => {
    // no_ids = create folder for unknowns, put all images in 'no-ids' folder for future matching
    if (title === 'no_ids') {
        console.warn('Parsing no_ids, from slides', start, 'to', end);
        parseNoIdSealSlides({ start, end });
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

const parseNoIdSealSlides = ({ start, end }) => {
    let totalNoIds = 0;
    let index = 1;
    let date = new Date().getTime();
    for (let i = start; i <= end; i++) {
        // Create a folder for the new Ids
        const folder = `${imageOutputDir}no-ids/originals`;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        } else {
            const files = fs.readdirSync(folder);
            index = files.length + 1;
        }

        const count = parseSlideMetaForImages({ folder, id: 'no', i, index, date });
        totalNoIds += count;
    }

    addSealToTotals({ masterSealName: 'no-ids', seal: 'no-ids', count: totalNoIds });
};

const parseKnownSealSlides = ({ start, end }) => {
    // Read each slide res file and read the images found
    let index = 1;
    let date = new Date().getTime();
    for (let i = start; i <= end; i++) {
        const slide = fs.readFileSync(`${baseSlideDir}slide${convertNumber(i)}.xml`, 'utf8');

        const sealNameRegex = new RegExp(/<a:t>((\s)?([A-Z]{1,5}[\d]{1,5})(\s)?)/g);
        const sealNameInSlide = sealNameRegex.exec(slide);
        if (sealNameInSlide) {
            const seal = sealNameInSlide[1].trim();
            console.log('Slide', i, 'Seal name', seal);

            const masterSealName = getMasterSealName(seal);

            foundSeals.push(masterSealName);

            const minioFolderName = getSealFolder(masterSealName);

            // Create a folder for the seal
            const folder = imageOutputDir + minioFolderName + '/originals';
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            } else {
                const files = fs.readdirSync(folder);
                index = files.length + 1;
            }

            const count = parseSlideMetaForImages({ folder, id: masterSealName, i, index, date });
            addSealToTotals({ masterSealName, seal, count });
        }
    }
};

const addSealToTotals = ({ masterSealName, seal, count }) => {
    if (masterSealName in slideSeals) {
        if (masterSealName === 'no-ids') {
            slideSeals[masterSealName]['no-ids'] = slideSeals[masterSealName]['no-ids'] + count;
        } else {
            const existingCount = slideSeals[masterSealName][seal];
            slideSeals[masterSealName][seal] = existingCount + count;
        }
    } else {
        slideSeals[masterSealName] = {};
        slideSeals[masterSealName][seal] = count;
    }
};

const parseSlideMetaForImages = ({ folder, id, i, index, date }) => {
    const slideData = fs.readFileSync(`${baseSlideDir}slide.xml/slide${i}.xml.rels`, 'utf8');
    const regex = /Target="..\/media([\s\S]*?)"/g;
    let imagesInSlide = 0;

    while ((m = regex.exec(slideData)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        const image = m[0].replace('Target="../media/', '').replace('"', '');
        const file = `${config.pptProcessingDir}ppt/media/${image}`;
        if (fs.existsSync(file)) {
            const renamedImage = createSealImageName({ imagePrefix, folder, file, id, index, date });
            fs.renameSync(file, renamedImage);
            console.log(i, index, id, file, renamedImage);

            imagesInSlide += 1;
            index += 1;
        }
    }
    return imagesInSlide;
};

module.exports = {
    extractSlideText,
    extractSealsFromSlides,
    findTitleSlides
};
