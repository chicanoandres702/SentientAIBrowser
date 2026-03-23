// Feature: Tooling | Why: Second-pass alias path fixer — corrects residual @alias mismatches
const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      
      let newContent = content.replace(/['"]\.\.\/components\//g, match => match.replace('../components/', '../../components/'));
      newContent = newContent.replace(/['"]\.\.\/services\//g, match => match.replace('../services/', '../../services/'));
      newContent = newContent.replace(/['"]\.\.\/settings\//g, match => match.replace('../settings/', '../../settings/'));

      if (content !== newContent) {
        fs.writeFileSync(p, newContent);
        console.log(`Updated ${p}`);
      }
    }
  }
}

walk('src/features');
walk('src/hooks');
walk('src/ui');