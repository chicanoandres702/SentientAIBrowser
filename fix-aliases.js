// Feature: Tooling | Why: Rewrites @alias import paths to relative paths — one-shot migration script
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      let newContent = content.replace(/['"]\.\.\/components\/.*?['"]/g, match => {
        return match.replace('../components/', '../../components/');
      });
      if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log(`Updated ${p}`);
      }
    }
  }
}

walk('src/features/browser');
walk('src/features/ui');
walk('src/features/settings');