// Feature: Deep Research | Why: Isolated from browser proxy routes — clear feature boundary.
// Async Plan→Execute→Synthesize research pipeline with SSE-style polling.
import * as path from 'path';
import * as fs from 'fs';
import { Express } from 'express';
import { DeepResearchAgent } from './features/deep-research/deep-research-agent';
import { RunResult } from './features/deep-research/deep-research.types';

const activeAgents = new Map<string, DeepResearchAgent>();

export function setupDeepResearchRoutes(app: Express): void {
    /** POST /agent/deep-research/start — fire-and-forget, poll for results */
    app.post('/agent/deep-research/start', (req, res): void => {
        const { topic, taskId, maxParallelSearches = 3 } = req.body;
        if (!topic) { res.status(400).json({ error: 'topic required' }); return; }
        const id = (taskId as string) || `dr_${Date.now()}`;
        const outputDir = path.join(process.cwd(), '.research', id);
        const agent = new DeepResearchAgent(maxParallelSearches);
        activeAgents.set(id, agent);
        agent.run(topic, id, outputDir)
            .then((r: RunResult) => { console.log(`[DeepResearch] ${id} done: ${r.status}`); activeAgents.delete(id); })
            .catch((e: Error) => { console.error(`[DeepResearch] ${id} error:`, e.message); activeAgents.delete(id); });
        res.json({ taskId: id, outputDir, message: 'Deep research started' });
    });

    /** POST /agent/deep-research/:taskId/stop */
    app.post('/agent/deep-research/:taskId/stop', (req, res): void => {
        const agent = activeAgents.get(req.params.taskId);
        if (!agent) { res.status(404).json({ error: 'Task not found or finished' }); return; }
        agent.stop();
        res.json({ message: 'Stop signal sent' });
    });

    /** GET /agent/deep-research/:taskId/report — returns final_report.md when ready */
    app.get('/agent/deep-research/:taskId/report', (req, res): void => {
        const reportPath = path.join(process.cwd(), '.research', req.params.taskId, 'final_report.md');
        if (!fs.existsSync(reportPath)) {
            const running = activeAgents.has(req.params.taskId);
            res.status(running ? 202 : 404).json({ message: running ? 'Still running' : 'Not found' });
            return;
        }
        res.type('text/markdown').send(fs.readFileSync(reportPath, 'utf-8'));
    });

    /** GET /agent/deep-research/:taskId/plan — returns research_plan.md for progress display */
    app.get('/agent/deep-research/:taskId/plan', (req, res): void => {
        const planPath = path.join(process.cwd(), '.research', req.params.taskId, 'research_plan.md');
        if (!fs.existsSync(planPath)) { res.status(404).json({ error: 'Plan not found' }); return; }
        res.type('text/markdown').send(fs.readFileSync(planPath, 'utf-8'));
    });
}
