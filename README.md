# USAGE: 'node main.js "path/to/model/file" (optional: false)

The script will make a folder in the directory of the script named "data" with the JSON file inside, and if using imageStream will make a "tex" folder where the final images will go
Note: It will make a bunch of nondescript files within the folder, these are just placeholders for the image data, as python doesn't handle a lot of data at once very well

# AGB to JSON

This project uses scripts derived from Noclip's source code, in how it handles TTYD's data to parse the raw values of the character files (In the 'a' folder)

If the texture file is in the same directory as the model file (and named the same thing with a "-" at the end) it will automatically attempt to use the included python scripts to extract all of the images from it

You can include "false" at the end of the command line argument to avoid attempting to use python

This is just a data dump at the moment and in no way actually utilizes the data.. yet
