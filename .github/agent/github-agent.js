// GitHub API Agent
const { execSync } = require('child_process');
// Use global fetch in Node.js v24+

class GitHubAgent {
  static async getRepoInfo(owner, repo) {
    // Example REST API call
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    return await res.json();
  }

  static runCLICommand(cmd) {
    return execSync(cmd).toString();
  }
}

module.exports = GitHubAgent;
