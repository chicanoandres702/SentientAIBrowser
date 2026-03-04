// GitHub CLI Orchestrator Agent
const { execSync } = require('child_process');

class GhOrchestratorAgent {
  static createIssue(title, body) {
    const cmd = `gh issue create --title "${title}" --body "${body}"`;
    return execSync(cmd).toString();
  }

  static createPR(title, body, base = 'main') {
    const cmd = `gh pr create --title "${title}" --body "${body}" --base ${base}`;
    return execSync(cmd).toString();
  }

  static mergePR(prNumber) {
    const cmd = `gh pr merge ${prNumber} --auto`;
    return execSync(cmd).toString();
  }

  static commentIssue(issueNumber, comment) {
    const cmd = `gh issue comment ${issueNumber} --body "${comment}"`;
    return execSync(cmd).toString();
  }

  static listIssues() {
    const cmd = `gh issue list`;
    return execSync(cmd).toString();
  }
}

module.exports = GhOrchestratorAgent;
