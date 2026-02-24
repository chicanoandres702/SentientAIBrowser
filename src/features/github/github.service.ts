// Feature: GitHub | Trace: README.md
import { Octokit } from 'octokit';
import { GitHubIssueManager } from './github-issue-manager';

export class GitHubService {
    private octokit: Octokit;
    private issueManager: GitHubIssueManager;

    constructor(token: string, private owner: string, private repo: string) {
        this.octokit = new Octokit({ auth: token });
        this.issueManager = new GitHubIssueManager(this.octokit, owner, repo);
    }

    async createIssue(t: string, b: string, l: string[] = ['ai-autonomy', 'bug'], m?: number) {
        return this.issueManager.createIssue(t, b, l, m);
    }

    async getOrCreateMilestone(title: string) {
        return this.issueManager.getOrCreateMilestone(title);
    }

    async updateFile(path: string, content: string, message: string) {
        let sha: string | undefined;
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner, repo: this.repo, path
            });
            if (!Array.isArray(data)) sha = data.sha;
        } catch (e) {
            console.log(`[GitHubService] File ${path} not found.`);
        }

        const response = await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.owner, repo: this.repo, path, message,
            content: Buffer.from(content).toString('base64'), sha
        });
        return response.data;
    }

    async recordKnowledge(path: string, knowledge: string) {
        let existingContent = '';
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner: this.owner, repo: this.repo, path
            });
            if (!Array.isArray(data) && 'content' in data) {
                existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
            }
        } catch (e) {}

        const updatedContent = existingContent
            ? `${existingContent}\n\n### Entry: ${new Date().toISOString()}\n${knowledge}`
            : `# AI Knowledge Base: ${path}\n\n### Entry: ${new Date().toISOString()}\n${knowledge}`;

        return await this.updateFile(path, updatedContent, `AI autonomous knowledge update: ${path}`);
    }

    async lookupDocumentation(query: string) {
        const response = await this.octokit.rest.search.code({
            q: `${query} repo:${this.owner}/${this.repo}`
        });
        return response.data.items.map(item => ({
            name: item.name, path: item.path, url: item.html_url
        }));
    async syncTasksToIssues(tasks: any[]) {
        return this.issueManager.syncTasksToIssues(tasks);
    }
}
