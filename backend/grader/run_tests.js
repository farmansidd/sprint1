const { spawn } = require('child_process');
const fs = require('fs');

async function run() {
    // Find entry file
    let entryFile;
    if (fs.existsSync('main.js')) {
        entryFile = 'main.js';
    } else if (fs.existsSync('index.js')) {
        entryFile = 'index.js';
    } else {
        // Find any .js file
        const files = fs.readdirSync('.');
        const jsFiles = files.filter(f => f.endsWith('.js') && f !== 'run_tests.js');

        if (jsFiles.length > 0) {
            entryFile = jsFiles[0];
            console.log(`Auto-detected entry file: ${entryFile}`);
        } else {
            console.log("FAIL");
            console.error("No .js files found");
            process.exit(1);
        }
    }

    // Spawn the user's process
    const child = spawn('node', [entryFile], {
        timeout: 20000 // 20s timeout
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log("PASS");
            // We might want to print stdout too if needed, but the Python one doesn't for PASS
        } else {
            console.log("FAIL");
            console.log(stderr || stdout); // Print error output
        }
        process.exit(code || 1);
    });

    child.on('error', (err) => {
        console.log("ERROR");
        console.log(err.message);
        process.exit(2);
    });
}

run();
