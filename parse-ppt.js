const fs = require("fs");
const rimraf = require("rimraf");
const execSync = require("child_process").execSync;
const imageScript = require("./images.js");
const outputDir = "./output/";

const toProcessDir = "./input/";
const processedDir = "./processed/";

const processPPTs = () => {
  const files = fs.readdirSync(toProcessDir);
  files.forEach(function(file) {
    let filename = file.split(".")[0];
    processPPT(filename);
  });
};

const processPPT = filename => {
  rimraf.sync(outputDir);
  fs.mkdirSync(outputDir);
  zip(filename);
  unzip(filename);

  imageScript.renameSlides();
  imageScript.extractSealsFromSlides();

  fs.renameSync(
    toProcessDir + filename + ".pptx",
    processedDir + filename + ".pptx"
  );
};

const zip = filename => {
  execSync(
    "cd " +
      toProcessDir +
      " && cp '" +
      filename +
      ".pptx' ." +
      outputDir +
      "ppt" +
      ".zip"
  );
};

const unzip = filename => {
  execSync("cd " + outputDir + " && unzip ppt.zip");
};

module.exports = {
  processPPTs
};
