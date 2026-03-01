"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDeepResearchRoutes = setupDeepResearchRoutes;
// Feature: Deep Research | Why: Isolated from browser proxy routes — clear feature boundary.
// Async Plan→Execute→Synthesize research pipeline with SSE-style polling.
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const deep_research_agent_1 = require("./features/deep-research/deep-research-agent");
const activeAgents = new Map();
function setupDeepResearchRoutes(app) {
    /** POST /agent/deep-research/start — fire-and-forget, poll for results */
    app.post('/agent/deep-research/start', (req, res) => {
        const { topic, taskId, maxParallelSearches = 3 } = req.body;
        if (!topic) {
            res.status(400).json({ error: 'topic required' });
            return;
        }
        const id = taskId || `dr_${Date.now()}`;
        const outputDir = path.join(process.cwd(), '.research', id);
        const agent = new deep_research_agent_1.DeepResearchAgent(maxParallelSearches);
        activeAgents.set(id, agent);
        agent.run(topic, id, outputDir)
            .then((r) => { console.log(`[DeepResearch] ${id} done: ${r.status}`); activeAgents.delete(id); })
            .catch((e) => { console.error(`[DeepResearch] ${id} error:`, e.message); activeAgents.delete(id); });
        res.json({ taskId: id, outputDir, message: 'Deep research started' });
    });
    /** POST /agent/deep-research/:taskId/stop */
    app.post('/agent/deep-research/:taskId/stop', (req, res) => {
        const agent = activeAgents.get(req.params.taskId);
        if (!agent) {
            res.status(404).json({ error: 'Task not found or finished' });
            return;
        }
        agent.stop();
        res.json({ message: 'Stop signal sent' });
    });
    /** GET /agent/deep-research/:taskId/report — returns final_report.md when ready */
    app.get('/agent/deep-research/:taskId/report', (req, res) => {
        const reportPath = path.join(process.cwd(), '.research', req.params.taskId, 'final_report.md');
        if (!fs.existsSync(reportPath)) {
            const running = activeAgents.has(req.params.taskId);
            res.status(running ? 202 : 404).json({ message: running ? 'Still running' : 'Not found' });
            return;
        }
        res.type('text/markdown').send(fs.readFileSync(reportPath, 'utf-8'));
    });
    /** GET /agent/deep-research/:taskId/plan — returns research_plan.md for progress display */
    app.get('/agent/deep-research/:taskId/plan', (req, res) => {
        const planPath = path.join(process.cwd(), '.research', req.params.taskId, 'research_plan.md');
        if (!fs.existsSync(planPath)) {
            res.status(404).json({ error: 'Plan not found' });
            return;
        }
        res.type('text/markdown').send(fs.readFileSync(planPath, 'utf-8'));
    });
}
//# sourceMappingURL=proxy-routes-research.js.map