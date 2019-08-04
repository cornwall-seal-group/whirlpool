# Catalogue Parser

This project parses a PPT in the `input/` folder and moves the image found into the correct directories.

It works by looking for the known title slides; either:

- New Ids
- Re Ids
- Taggies
- No Ids
- New Matches

and puts the subsequent images in the correct folders.

## Process

Put a PPT in the `input/` folder, then run the following commands:

`npm run parse-ppt`

`npm run rename-slides`

`npm run extract-seals`
