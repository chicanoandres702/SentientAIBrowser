const fs = require('fs');
const path = require('path');

const MAX_LINES = 100;
const EXCLUDED_DIRS = ['.git', 'node_modules', '.expo', 'assets', '.gemini', '.vscode', 'dist', 'build', 'out', '.next'];
const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

console.log('--- SENTIENT CODE VALIDATION ---');

function stripCommentsAndWhitespace(content) {
    // Remove multi-line comments
    let stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    stripped = stripped.replace(/\/\/.*$/gm, '');
    // Remove purely empty lines OR lines that are just spaces
    const lines = stripped.split('\n');
    const validLines = lines.filter(line => line.trim().length > 0);
    return validLines;
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const validLines = stripCommentsAndWhitespace(content);
    const linesCount = validLines.length;
    const fileName = path.basename(filePath);

    if (linesCount > MAX_LINES) {
        const overBy = linesCount - MAX_LINES;
        console.error('\x1b[31m%s\x1b[0m', `[VIOLATION] ${fileName} exceeds the 100-line law (${linesCount} lines, which is ${overBy} lines over).`);
        console.log('\x1b[33m%s\x1b[0m', `   -> Hint: To fix this quickly, run the AI refactoring workflow via slash command:`);
        console.log('\x1b[36m%s\x1b[0m', `      /code-refactoring-refactor-clean`);
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
    console.error('\n\x1b[41m SENTIENT CODEBASE CHECK FAILED \x1b[0m');
    console.error('\x1b[31mPlease refactor large AI Token Density files before committing.\x1b[0m\n');
    process.exit(1);
} else {
    console.log('\n\x1b[32mSENTIENT CODEBASE CHECK PASSED! Proceeding with commit.\x1b[0m');
    process.exit(0);
}
