# Whirlpool

This project parses PPTs or Zip files and saves the outputted images to the specified folder in the `config/{env}.json` file. It should work with either albums or catalogues that have been created by the Cornwall Seal Group.

It works by looking for the known title slides and parsing the images of seals in the subsequent slides; titles such as  `"re_ids", "new_ids", "new_matches", "new_match_up", "no_ids", "taggies", "netties", "entangled"` are known titled slides. The full list is defined in the `src/utils/process-images.js` file.

When a Zip or PPT is being processed, the contents are put into the `input/` folder and moves the imagesfound into the correct directories.


## Running the application

It is a node REST API, you can run it using `npm run start` which will use the config from `config/{env}.json`

See `src/routes.js` for the different routes available

## Process

For an individual PPT album it will do the following:

- zip your PPT
- unzip it, to extract the slide XML and images
- rename the slides so they are processed in numerical order, i.e. slide1.xml to slide0001.xml
- loop through the slides and find all title slides (slides without any images and text)
- compare the found title slides and process the slides between accordingly:
  - for `No Ids`, the images are added to the no-ids folder
  - for all other types of header we know of (listed above) we find the seal name in the slide and put all the images from that slide in a folder with the seals name


## Running with forever

To run the app using forever run in PROD mode:

```
export NODE_ENV=prod && nohup forever start -c "node src/index.js" ./
```
