const fs = require('fs');
const path = require('path');

const MAX_LINES = 100;
const EXCLUDED_DIRS = ['.git', 'node_modules', '.expo', 'assets', '.gemini'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

console.log('--- SENTIENT CODE VALIDATION ---');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const fileName = path.basename(filePath);

    if (lines > MAX_LINES) {
        console.error(`[VIOLATION] ${fileName} exceeds the 100-line law (${lines} lines).`);
        return false;
    }
    return true;
}

function traverse(dir) {
    let success = true;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(file)) {
                if (!traverse(fullPath)) success = false;
            }
        } else {
            const ext = path.extname(file);
            if (TARGET_EXTENSIONS.includes(ext)) {
                if (!checkFile(fullPath)) success = false;
            }
        }
    }
    return success;
}

const isSentient = traverse('.');

if (!isSentient) {
    console.error('\nSENTIENT CODEBASE CHECK FAILED! Please refactor large files before committing.');
    process.exit(1);
} else {
    console.log('\nSENTIENT CODEBASE CHECK PASSED! Proceeding with commit.');
    process.exit(0);
}
