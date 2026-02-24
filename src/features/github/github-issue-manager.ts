// Feature: GitHub | Trace: README.md
import { Octokit } from 'octokit';

export const CATEGORY_TO_MILESTONE: Record<string, string> = {
    bug: 'Bug Fixes & Maintenance',
    feature: 'Feature Development',
    chore: 'Technical Debt & Chores',
    docs: 'Documentation',
    refactor: 'Refactoring & Optimization'
};

export class GitHubIssueManager {
    constructor(private octokit: Octokit, private owner: string, private repo: string) {}

    async createIssue(title: string, body: string, labels: string[] = ['ai-autonomy', 'bug'], milestone?: number) {
        const response = await this.octokit.rest.issues.create({
            owner: this.owner, repo: this.repo, title, body, labels, milestone
        });
        return response.data;
    }

    async getOrCreateMilestone(title: string) {
        const { data: milestones } = await this.octokit.rest.issues.listMilestones({
            owner: this.owner, repo: this.repo, state: 'open'
        });
        const existing = milestones.find(m => m.title === title);
        if (existing) return existing;

        const { data: created } = await this.octokit.rest.issues.createMilestone({
            owner: this.owner, repo: this.repo, title,
            description: `Automatically created milestone for: ${title}`
        });
        return created;
    async syncTasksToIssues(tasks: any[]) {
        const { data: existingIssues } = await this.octokit.rest.issues.listForRepo({
            owner: this.owner, repo: this.repo, state: 'all', labels: 'ai-autonomy'
        });

        for (const task of tasks) {
            const exists = existingIssues.some(issue => issue.title === task.title);
            if (!exists && task.status !== 'completed') {
                let mNum: number | undefined;
                let mTitle = task.milestone || (task.category && CATEGORY_TO_MILESTONE[task.category]);

                if (mTitle) {
                    const m = await this.getOrCreateMilestone(mTitle);
                    mNum = m.number;
                }

                const labels = ['ai-autonomy', 'task-sync'];
                if (task.category) labels.push(`type:${task.category}`);

                await this.createIssue(
                    task.title,
                    `**Task ID**: ${task.id}\n**Status**: ${task.status}\n**Details**: ${task.details || 'No details'}\n\n*Synced from Sentient Browser tasks.json*`,
                    labels, mNum
                );
            }
        }
    }
}
