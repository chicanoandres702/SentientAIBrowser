import { Octokit } from 'octokit';

/**
 * GitHubService: Handles interactions with GitHub repositories.
 * Used for automated issue tracking and documentation updates.
 */

const CATEGORY_TO_MILESTONE: Record<string, string> = {
    bug: 'Bug Fixes & Maintenance',
    feature: 'Feature Development',
    chore: 'Technical Debt & Chores',
    docs: 'Documentation',
    refactor: 'Refactoring & Optimization'
};

export class GitHubService {
    private octokit: Octokit;
    private owner: string;
    private repo: string;

    constructor(token: string, owner: string, repo: string) {
        this.octokit = new Octokit({ auth: token });
        this.owner = owner;
        this.repo = repo;
    }

    /**
     * Creates a new GitHub issue, optionally assigned to a milestone.
     */
    async createIssue(title: string, body: string, labels: string[] = ['ai-autonomy', 'bug'], milestone?: number) {
        try {
            const response = await this.octokit.rest.issues.create({
                owner: this.owner,
                repo: this.repo,
                title,
                body,
                labels,
                milestone
            });
            return response.data;
        } catch (e) {
            console.error('[GitHubService] Failed to create issue:', e);
            throw e;
        }
    }

    /**
     * Retrieves an existing milestone or creates it if not found.
     */
    async getOrCreateMilestone(title: string) {
        try {
            const { data: milestones } = await this.octokit.rest.issues.listMilestones({
                owner: this.owner,
                repo: this.repo,
                state: 'open'
            });

            const existing = milestones.find(m => m.title === title);
            if (existing) return existing;

            const { data: created } = await this.octokit.rest.issues.createMilestone({
                owner: this.owner,
                repo: this.repo,
                title,
                description: `Automatically created milestone for: ${title}`
            });
            return created;
        } catch (e) {
            console.error('[GitHubService] Failed to manage milestone:', e);
            throw e;
        }
    }

    /**
     * Updates an existing file or creates a new one in the repository.
     */
    async updateFile(path: string, content: string, message: string) {
        try {
            // Get the current file content to get the SHA
            let sha: string | undefined;
            try {
                const { data } = await this.octokit.rest.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path
                });
                if (!Array.isArray(data)) {
                    sha = data.sha;
                }
            } catch (e) {
                // File might not exist, which is fine for creation
                console.log(`[GitHubService] File ${path} not found, will create new.`);
            }

            const response = await this.octokit.rest.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path,
                message,
                content: Buffer.from(content).toString('base64'),
                sha
            });
            return response.data;
        } catch (e) {
            console.error('[GitHubService] Failed to update file:', e);
            throw e;
        }
    }

    /**
     * Appends or updates knowledge in a specific repository file.
     */
    async recordKnowledge(path: string, knowledge: string) {
        try {
            let existingContent = '';
            try {
                const { data } = await this.octokit.rest.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path
                });
                if (!Array.isArray(data) && 'content' in data) {
                    existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
                }
            } catch (e) {
                console.log(`[GitHubService] Starting new knowledge file: ${path}`);
            }

            const updatedContent = existingContent
                ? `${existingContent}\n\n### Entry: ${new Date().toISOString()}\n${knowledge}`
                : `# AI Knowledge Base: ${path}\n\n### Entry: ${new Date().toISOString()}\n${knowledge}`;

            return await this.updateFile(path, updatedContent, `AI autonomous knowledge update: ${path}`);
        } catch (e) {
            console.error('[GitHubService] Failed to record knowledge:', e);
            throw e;
        }
    }

    /**
     * Searches for documentation or relevant files in the repository.
     */
    async lookupDocumentation(query: string) {
        try {
            const response = await this.octokit.rest.search.code({
                q: `${query} repo:${this.owner}/${this.repo}`
            });
            return response.data.items.map(item => ({
                name: item.name,
                path: item.path,
                url: item.html_url
            }));
        } catch (e) {
            console.error('[GitHubService] Failed to lookup documentation:', e);
            throw e;
        }
    }

    async syncTasksToIssues(tasks: any[]) {
        try {
            const { data: existingIssues } = await this.octokit.rest.issues.listForRepo({
                owner: this.owner,
                repo: this.repo,
                state: 'all',
                labels: 'ai-autonomy'
            });

            for (const task of tasks) {
                const issueExists = existingIssues.some(issue => issue.title === task.title);
                if (!issueExists && task.status !== 'completed') {
                    let milestoneNumber: number | undefined;
                    
                    let milestoneTitle = task.milestone;
                    if (!milestoneTitle && task.category && CATEGORY_TO_MILESTONE[task.category]) {
                        milestoneTitle = CATEGORY_TO_MILESTONE[task.category];
                    }

                    if (milestoneTitle) {
                        const m = await this.getOrCreateMilestone(milestoneTitle);
                        milestoneNumber = m.number;
                    }

                    const labels = ['ai-autonomy', 'task-sync'];
                    if (task.category) {
                        labels.push(`type:${task.category}`);
                    }

                    await this.createIssue(
                        task.title,
                        `**Task ID**: ${task.id}\n**Status**: ${task.status}\n**Details**: ${task.details || 'No details provided.'}\n\n*Synced from Sentient AI Browser tasks.json*`,
                        labels,
                        milestoneNumber
                    );
                }
            }
        } catch (e) {
            console.error('[GitHubService] Task sync failed:', e);
            throw e;
        }
    }
}
