// Feature: Core | Trace: sync-service.js
const { execSync } = require('child_process');

function execCmd(cmd, cwd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', cwd }).trim();
    } catch (e) {
        console.error(`[GH Sync Error] Command failed: ${cmd}`);
        return null;
    }
}

function getSafeTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = { execCmd, getSafeTitle };
