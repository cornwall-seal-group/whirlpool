/*
Images Script

*/

const fs = require("fs");
const parser = require("xml2json");
const rimraf = require("rimraf");

const baseSlideDir = "./output/ppt/slides/";
const baseImageDir = "./output/ppt/media/";

const imagesDir = "./slides/formatted-images/";
const imageOutputDir = "./extracted-images/";

// rimraf.sync(outputDir);
// fs.mkdirSync(outputDir);

const convertNumberInFile = file => {
  const number = file.substr(5).split(".")[0];

  let formattedNum = number;

  if (number.length === 1) {
    formattedNum = "000" + number;
  } else if (number.length === 2) {
    formattedNum = "00" + number;
  } else if (number.length === 3) {
    formattedNum = "0" + number;
  }

  return formattedNum;
};

const convertNumber = number => {
  number = number.toString();
  let formattedNum = number;

  if (number.length === 1) {
    formattedNum = "000" + number;
  } else if (number.length === 2) {
    formattedNum = "00" + number;
  } else if (number.length === 3) {
    formattedNum = "0" + number;
  }

  return formattedNum;
};

// Loop through all the slide files
const renameSlides = () => {
  const files = fs.readdirSync(baseSlideDir);
  files.forEach(function(file, index) {
    const formattedNum = convertNumberInFile(file);
    const ext = "xml";
    fs.renameSync(
      baseSlideDir + file,
      baseSlideDir + "slide" + formattedNum + "." + ext
    );
  });
};

// Loop through all the image files
const renameImages = () => {
  fs.readdir(baseImageDir, function(err, files) {
    files.forEach(function(file, index) {
      const formattedNum = convertNumberInFile(file);

      fs.createReadStream(baseImageDir + file).pipe(
        fs.createWriteStream(imagesDir + "image" + formattedNum + "." + ext)
      );
    });
  });
};

// Loop through all the slide files - this will output all text; some are maybe wrong
const extractSlideText = () => {
  console.log(baseSlideDir);
  fs.readdir(baseSlideDir, function(err, files) {
    files.forEach(function(file) {
      console.log(file);
      fs.readFile(baseSlideDir + file, "utf8", function(err, data) {
        if (!data) return;
        const json = JSON.parse(parser.toJson(data));
        console.log(data);
        try {
          const title =
            json["p:sld"]["p:cSld"]["p:spTree"]["p:sp"][0]["p:txBody"]["a:p"][
              "a:r"
            ]["a:t"];

          if (title.indexOf("is") > -1) {
            console.warn(file, title);
          }
        } catch (e) {}
      });
    });
  });
};

const knownTitles = [
  "re_ids",
  "new_ids",
  "new_matches",
  "no_ids",
  "taggies",
  "netties",
  "entangled"
];

// Loop through all the slide files and output the title slides with slide number
const findTitleSlides = () => {
  let previousTitle = {};
  const files = fs.readdirSync(baseSlideDir);
  files.forEach(function(file, index) {
    const filename = baseSlideDir + file;
    if (!fs.lstatSync(filename).isDirectory()) {
      const data = fs.readFileSync(filename, "utf8");

      if (data && data.indexOf("p:pic") === -1) {
        try {
          const regex = new RegExp(/<a:t>([\s\S]*?)<\/a:t>/g);
          // Only accept slides that have 1 string of text - not an essay slide!
          if (data.match(regex).length === 1) {
            const foundTitle = regex.exec(data)[1];
            const title = foundTitle
              .toLowerCase()
              .replace(/\s+/g, "_")
              .replace(/-/g, "_");

            if (Object.keys(previousTitle).length > 0) {
              console.warn(
                previousTitle.title,
                ": from",
                previousTitle.index + 1,
                "to",
                index - 1
              );
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
  console.warn(
    previousTitle.title,
    ": from",
    previousTitle.index + 1,
    "to",
    files.length - 1
  );
};

// Loop through all the slide files, find the titles and work out the slides
// in between. Then process each slide xml file to extract the images referenced
// in them. Fetch them and save them to the output folders
const extractSealsFromSlides = () => {
  let previousTitle = {};
  let categories = [];
  const files = fs.readdirSync(baseSlideDir);
  files.forEach(function(file, index) {
    const filename = baseSlideDir + file;
    if (!fs.lstatSync(filename).isDirectory()) {
      const data = fs.readFileSync(filename, "utf8");

      if (data && data.indexOf("p:pic") === -1) {
        try {
          const regex = new RegExp(/<a:t>([\s\S]*?)<\/a:t>/g);
          if (data.match(regex).length === 1) {
            const foundTitle = regex.exec(data)[1];
            const title = foundTitle.toLowerCase().replace(/\s+/g, "_");

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
};

const getImagesForTheCategory = ({ title, start, end }) => {
  // re_ids = create folder per seal if not already exists and add photos to folder
  // new_ids = create folder per seal if not already exists and add photos to folder
  // taggies = create folder per seal if not already exists and add photos to folder
  // no_ids = create folder for unknowns, put all images in folder

  if (title === "no_ids") {
    parseNewSealSlides({ start, end });
  } else if (knownTitles.includes(title)) {
    // Find the seal name in the slide
    // Create a folder for that seal if not already exists
    // Go through the images in the slide and add to the folder

    // TODO check name found correctly in slide
    parseKnownSealSlides({ start, end });
  } else {
    console.warn("Unknown title type", title, ", ignoring");
  }
};

const parseNewSealSlides = ({ start, end }) => {
  let index = 1;
  for (let i = start; i < end; i++) {
    //Create a folder for the new Ids
    const folder = imageOutputDir + "no-ids";
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    } else {
      const files = fs.readdirSync(folder);
      index = files.length + 1;
    }

    parseSlideMetaForImages({ folder, id: "new", i, index });
  }
};

const parseKnownSealSlides = ({ start, end }) => {
  // Read each slide res file and read the images found
  for (let i = start; i < end; i++) {
    let index = 1;

    const slide = fs.readFileSync(
      baseSlideDir + "slide" + convertNumber(i) + ".xml",
      "utf8"
    );

    //const sealNameRegex = new RegExp(/<a:t>([A-Z]*[0-9]*?)(\s)?<\/a:t>/g);
    //const sealNameRegex = new RegExp(/<a:t>((\s)?([A-Z]*(\d+)?)(\s)?)/g);
    const sealNameRegex = new RegExp(/<a:t>((\s)?([A-Z]{1,5}[\d]{1,5})(\s)?)/g);
    const seal = sealNameRegex.exec(slide)[1].trim();
    console.log(i, seal);

    //Create a folder for the seal
    const folder = imageOutputDir + seal;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    } else {
      const files = fs.readdirSync(folder);
      index = files.length + 1;
    }

    parseSlideMetaForImages({ folder, id: seal, i, index });
  }
};

const parseSlideMetaForImages = ({ folder, id, i, index }) => {
  const slideData = fs.readFileSync(
    baseSlideDir + "slide.xml/slide" + i + ".xml.rels",
    "utf8"
  );
  const regex = /Target="..\/media([\s\S]*?)"/g;
  while ((m = regex.exec(slideData)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    const image = m[0].replace('Target="../media/', "").replace('"', "");
    const file = "./output/ppt/media/" + image;

    if (fs.existsSync(file)) {
      const extDot = file.lastIndexOf(".");
      const ext = file.substr(extDot);
      const renamedImage = folder + "/" + id + "-" + index + ext;
      fs.renameSync(file, renamedImage);
      console.log(i, index, id, file, renamedImage);

      index += 1;
    }
  }
};

module.exports = {
  renameSlides,
  renameImages,
  extractSlideText,
  extractSealsFromSlides,
  findTitleSlides
};
