# Catalogue Parser

This project parses a PPT in the `input/` folder and moves the image found into the correct directories.

It works by looking for the known title slides; either:

`const knownTitles = [ "re_ids", "new_ids", "new_matches", "no_ids", "taggies", "netties", "entangled" ];`

and puts the subsequent images in the correct folders.

## Process

Put your Powerpoint presentations in the `input/` folder, then run the following command:

`npm run process-ppts`

It will do the following:

- zip you PPT
- unzip it, to extract the slide XML and images
- rename the slides so they are processed in numerical order, i.e. slide1.xml to slide0001.xml
- loop through the slides and find all title slides (slides without any images and text)
- compare the found title slides and process the slides between accordingly:
  - for `No Ids`, the images are added to the no-ids folder
  - for all other types of header we know of (listed above) we find the seal name in the slide and put all the images from that slide in a folder with the seals name
