// Node script to parse AnimationGroupBase models into JSON data

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const agb = require('./agb');

/**
 * Processes the binary .d file.
 * @param {string} filePath - The path to the file.
 * @param {boolean} runImageStream - Whether to run imageStream.py.
 */
function processFile(filePath, runImageStream) {
    try {
        console.log(filePath);

        if (runImageStream) {
            // Extract images:
            const pythonScript = path.join(__dirname, 'imageStream.py');
            const argument = `${filePath}-`;

            console.log(`Running imageStream.py with argument: ${argument}`);

            // Spawn the Python process
            const pythonProcess = spawn('py', [pythonScript, argument]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`imageStream.py: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`imageStream.py ERROR: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`imageStream.py exited with code ${code}`);
                }
            });
        } else {
            console.log("Skipping imageStream.py execution.");
        }

        // Read the binary file as a buffer
        const buffer = fs.readFileSync(filePath);
        modelname = path.basename(filePath, path.extname(filePath));

        // Convert Buffer to ArrayBuffer
        const arrayBuffer = new Uint8Array(buffer).buffer;

        // Call loadEvent with the ArrayBuffer
        loadEvent({ result: arrayBuffer });
    } catch (error) {
        console.error("Error reading file:", error);
        console.error(error.stack);
        process.exit(1);
    }
}

/**
 * Handles the loaded data from the binary file.
 * @param {Object} event - An object containing the binary data.
 */
function loadEvent(event) {
    // Based off pmmap.newArrayBufferSlice
    const arrayBufferSlice = agb.newArrayBufferSlice(event.result);
    const raw = agb.parse(arrayBufferSlice);

    let result = {};

    // Create the data files using the updated model name
    drawData(raw);
}

/**
 * Generates and logs the JSON content.
 * @param {Object} raw - The parsed data.
 */
function drawData(raw) {
    const files = [
        { name: 'animGroupBase.json', data: JSON.stringify(raw, null, 2) },
    ];

    const dumpDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dumpDir)) {
        fs.mkdirSync(dumpDir, { recursive: true });
        console.log(`📂 Created directory: ${dumpDir}`);
    }

    for (const file of files) {
        if (file.data === undefined) {
            console.warn(`⚠️ Warning: Skipping ${file.name} because data is undefined.`);
            continue;
        }
        const filePath = path.join(__dirname, 'data', file.name);
        fs.writeFile(filePath, file.data, 'utf8', (err) => {
            if (err) {
                console.error("Error writing to file:", err);
            } else {
                console.log(`✅ Wrote: ${filePath}`);
            }
        });
    }
}

// Execute processFile with command-line arguments
async function main() {
    const args = process.argv.slice(2); // Get command-line arguments

    if (args.length < 1) {
        console.error('Usage: node main.js <binary_file_path> [runImageStream]');
        process.exit(1);
    }

    const binaryFilePath = args[0];
    const runImageStream = args.length > 1 ? args[1].toLowerCase() !== "false" : true;

    processFile(binaryFilePath, runImageStream);
}

// Run the main function
main();
