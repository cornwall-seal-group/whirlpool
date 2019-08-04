const fs = require("fs");
const rimraf = require("rimraf");
const execSync = require("child_process").execSync;

const outputDir = "./output/";

const toProcessDir = "./input/";

rimraf.sync(outputDir);
fs.mkdirSync(outputDir);

const processPPTs = () => {
  fs.readdir(toProcessDir, function(err, files) {
    files.forEach(function(file, index) {
      let filename = file.split(".")[0];
      processPPT(filename);
    });
  });
};

const processPPT = filename => {
  zip(filename);
  unzip(filename);
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
