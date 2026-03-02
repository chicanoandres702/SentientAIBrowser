// Feature: Tooling | Why: Rewrites import paths after file moves — one-shot migration script
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src').concat(walk('./functions/src'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix path ../features/auth -> ../auth (if in src/features/somefeature)
    // Actually, wait, let's use global regex for specific bad imports.

    content = content.replace(/from '\.\.\/\.\.\/App'/g, "from '../../../App'");
    content = content.replace(/from '\.\.\/features\/auth\/firebase-config'/g, "from '../auth/firebase-config'");
    content = content.replace(/from '\.\.\/features\/ui\/theme\/ui\.theme'/g, "from '../ui/theme/ui.theme'");
    content = content.replace(/from '\.\.\/features\/ui\/theme\/domain-accent\.utils'/g, "from '../ui/theme/domain-accent.utils'");
    content = content.replace(/from '\.\.\/features\/browser\//g, "from '../browser/");
    
    // Some are in src/features/browser already, so import '../features/browser/components/...' becomes import './components/...'
    if (file.includes('src\\features\\browser') || file.includes('src/features/browser')) {
        content = content.replace(/from '\.\.\/features\/browser\//g, "from './");
        content = content.replace(/from '\.\.\/features\/auth\//g, "from '../auth/");
        content = content.replace(/from '\.\.\/features\/ui\//g, "from '../ui/");
    }

    // Replace @features/browser -> @features/browser
    // Wait, the tsconfig already had "@features/*": ["src/features/*"]
    // Why was `@features/browser` not resolving? Because the index file was named `browser.index.ts`. We already renamed it to `index.ts`. So `@features/browser` should resolve now.

    // Fix firebase/db - should be firebase/firestore
    content = content.replace(/from 'firebase\/db'/g, "from 'firebase/firestore'");

    // Fix @/App -> ../../../App (or similar, depending on depth)
    // Wait, let's just make sure @/App isn't used if it doesn't work. Actually @ points to `src`, and `App` is in root.
    // Replace `@/App` with absolute relative depending on depth
    if (content.includes('@/App')) {
        const depth = file.split(path.sep).length - 2; // e.g. src/features/settings/menu.tsx -> 4 parts -> 2 ..
        const rel = '../'.repeat(depth) + 'App';
        content = content.replace(/from '@\/App'/g, `from '${rel}'`);
    }

    // Fix @core -> ../core
    if (content.includes('@core/safe-cloud.utils')) {
        content = content.replace(/'@core\/safe-cloud\.utils'/g, "'../../shared/safe-cloud.utils'");
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed imports in', file);
    }
}
