// Feature: System Utilities | Trace: README.md
const { exec } = require('child_process');

function setupGitRoutes(app) {
  app.post('/git/commit', (req, res) => {
    const { message } = req.body;
    const commitMsg = message || "AI: Autonomous Sync Update";
    
    console.log(`[Sentient Git] Committing with message: ${commitMsg}`);
    
    const command = \`git add . && git commit -m "\${commitMsg.replace(/"/g, '\\\\"')}" && git push\`;
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(\`[Sentient Git] Error: \${error.message}\`);
        return res.status(500).json({ error: error.message, details: stderr });
      }
      console.log(\`[Sentient Git] Success: \${stdout}\`);
      res.json({ success: true, output: stdout });
    });
  });
}

module.exports = { setupGitRoutes };
