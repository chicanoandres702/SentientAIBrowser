const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupGitRoutes(app) {
  // Existing commit endpoint
  app.post('/git/commit', (req, res) => {
    const { message } = req.body;
    const commitMsg = message || "AI: Autonomous Sync Update";
    console.log(`[Sentient Git] Committing with message: ${commitMsg}`);
    const command = `git add . && git commit -m "${commitMsg.replace(/"/g, '\\"')}" && git push`;
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Sentient Git] Error: ${error.message}`);
        return res.status(500).json({ error: error.message, details: stderr });
      }
      res.json({ success: true, output: stdout });
    });
  });

  // NEW: Create GitHub Issue via GH CLI
  app.post('/git/create-issue', (req, res) => {
    const { title, body } = req.body;
    try {
      console.log(`[Sentient Git] Creating issue: ${title}`);
      const output = execSync(`gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "ai-autonomy"`, { encoding: 'utf8' });
      res.json({ success: true, output });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // NEW: Record Knowledge to Local File (Orchestrator will push)
  app.post('/git/record-knowledge', (req, res) => {
    const { path: filePath, knowledge } = req.body;
    try {
      const absolutePath = path.join(__dirname, filePath);
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const entry = `\n\n### Entry: ${new Date().toISOString()}\n${knowledge}\n`;
      if (fs.existsSync(absolutePath)) {
        fs.appendFileSync(absolutePath, entry);
      } else {
        fs.writeFileSync(absolutePath, `# AI Knowledge Base: ${path.basename(filePath)}\n${entry}`);
      }
      res.json({ success: true, path: filePath });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // NEW: Lookup Docs via GH Code Search
  app.get('/git/lookup-docs', (req, res) => {
    const { query } = req.query;
    try {
      // Get current repo to scope search
      const repo = execSync('git remote get-url origin', { encoding: 'utf8' })
        .replace(/.*github.com[:/]/, '')
        .replace(/\.git$/, '')
        .trim();
      
      console.log(`[Sentient Git] Searching docs in ${repo} for: ${query}`);
      const output = execSync(`gh search code "${query}" --repo ${repo} --json path,textMatches`, { encoding: 'utf8' });
      const results = JSON.parse(output).map(item => ({
        name: item.path,
        path: item.path,
        url: `https://github.com/${repo}/blob/main/${item.path}`
      }));
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

module.exports = { setupGitRoutes };

