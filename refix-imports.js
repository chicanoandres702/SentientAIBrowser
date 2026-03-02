// Feature: Tooling | Why: Second-pass import path fixer — corrects residual mismatches
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Helper to calculate relative path from `file` to a target path relative to src
    function getRelative(targetInSrc) {
        const fileDir = path.dirname(path.resolve(file));
        const targetAbs = path.resolve('./src', targetInSrc);
        let rel = path.relative(fileDir, targetAbs).replace(/\\/g, '/');
        if (!rel.startsWith('.')) rel = './' + rel;
        return rel;
    }

    // Fix imports that were incorrectly changed to `../auth/` instead of `../features/auth/`
    // If we see `from '../auth/` inside `src/components/`, it should be `from '../features/auth/`
    if (file.includes(path.join('src', 'components'))) {
        content = content.replace(/from '\.\.\/auth\//g, "from '../features/auth/");
        content = content.replace(/from '\.\.\/browser\//g, "from '../features/browser/");
        content = content.replace(/from '\.\.\/ui\//g, "from '../features/ui/");
        content = content.replace(/from '\.\.\/\.\.\/App'/g, "from '../../App'");
        content = content.replace(/from '\.\.\/\.\.\/\.\.\/App'/g, "from '../../App'");
    }
    
    if (file.includes(path.join('src', 'hooks'))) {
        content = content.replace(/from '\.\.\/auth\//g, "from '../features/auth/");
        content = content.replace(/from '\.\.\/browser\//g, "from '../features/browser/");
        content = content.replace(/from '\.\.\/ui\//g, "from '../features/ui/");
    }

    if (file.includes(path.join('src', 'utils'))) {
        content = content.replace(/from '\.\.\/auth\//g, "from '../features/auth/");
        content = content.replace(/from '\.\.\/browser\//g, "from '../features/browser/");
    }
    
    if (file.includes(path.join('src', 'services'))) {
        content = content.replace(/from '\.\.\/auth\//g, "from '../features/auth/");
    }

    // Fix App imports everywhere
    // Find all variations of App.tsx imports: from '../../App', from '../../../App', taking them to the actual App.tsx
    content = content.replace(/from '.*?\/App'/g, `from '${getRelative('..') + '/App'}'`);
    content = content.replace(/from '@\/App'/g, `from '${getRelative('..') + '/App'}'`);

    // Fix component styles that might have been changed
    // In src/features/browser/browser.tabs.component.tsx:
    // import { styles } from './BrowserTabs.styles'; but it's in components/ BrowserTabs.styles
    if (file.endsWith('browser.tabs.component.tsx')) {
        content = content.replace(/'\.\/BrowserTabs.styles'/g, "'../components/BrowserTabs.styles'");
    }
    if (file.endsWith('browser.chrome.component.tsx')) {
        content = content.replace(/'\.\/BrowserChrome.styles'/g, "'../components/BrowserChrome.styles'");
    }
    if (file.endsWith('browser.control.component.tsx')) {
        content = content.replace(/'\.\/SentientControlPanel.styles'/g, "'../components/SentientControlPanel.styles'");
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Refixed imports in', file);
    }
}
