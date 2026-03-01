"use strict";
// Feature: GitHub Tracer | Trace: src/features/github/trace.md
// Why: Auto-creates GitHub Issues and branches for every mission and step so all
// AI orchestrator actions are traceable to the repo's Issue tree — implementing
// AI_CONSTITUTION §6 (Issue Hierarchy), §8 (Branch Path Law), §9 (Deep Traceability).
// Gracefully degrades to a no-op when GITHUB_TOKEN/OWNER/REPO env vars are absent.
Object.defineProperty(exports, "__esModule", { value: true });
exports.openMissionIssue = openMissionIssue;
exports.openStepIssue = openStepIssue;
exports.closeMissionIssue = closeMissionIssue;
const GITHUB_API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
/** Why: All requests share the same auth headers and JSON handling. */
async function gh(method, path, body) {
    if (!TOKEN || !OWNER || !REPO)
        return null;
    const res = await fetch(`${GITHUB_API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        console.warn(`[GitHubTracer] ${method} ${path} → ${res.status} ${res.statusText}`);
        return null;
    }
    return res.json();
}
/** slugify: URL-safe slug for branch names (§8 Path Law). Fallbacks to 'step' on empty result. */
const slugify = (t, max = 35) => {
    const s = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, max);
    return s || 'step';
};
/**
 * openMissionIssue: Creates the Epic-level Issue for a mission.
 * Why: Provides the root node of the §6 Issue Hierarchy tree — every step issue links back here.
 */
async function openMissionIssue(missionId, goal) {
    const issue = await gh('POST', `/repos/${OWNER}/${REPO}/issues`, {
        title: `[Mission] ${goal.slice(0, 80)}`,
        body: `**Mission ID:** \`${missionId}\`\n\n**Goal:** ${goal}\n\n` +
            `*Auto-created by BackendAIOrchestrator — AI_CONSTITUTION §6.*`,
        labels: ['ai-mission'],
    });
    if (!(issue === null || issue === void 0 ? void 0 : issue.number))
        return null;
    console.log(`[GitHubTracer] Epic issue #${issue.number} opened for mission ${missionId}`);
    return issue.number;
}
/**
 * openStepIssue: Creates a child Issue + branch for one decision cycle.
 * Why: Each LLM decision cycle becomes a traceable task (§6 Task node) with its
 * own branch (§8 Path Law: mission/<id>/step-<N>-<slug>-#<issue>).
 * Linking to parentIssueNum satisfies §6.2 Explicit Linkage.
 */
async function openStepIssue(missionId, stepNum, description, parentIssueNum) {
    const issue = await gh('POST', `/repos/${OWNER}/${REPO}/issues`, {
        title: `[Step ${stepNum}] ${description.slice(0, 70)}`,
        body: `**Mission:** \`${missionId}\`\n**Cycle:** ${stepNum}\n**Summary:** ${description}\n\n` +
            `Part of #${parentIssueNum} *(AI_CONSTITUTION §6.2)*`,
        labels: ['ai-step'],
    });
    if (!(issue === null || issue === void 0 ? void 0 : issue.number))
        return null;
    // Branch: mission/<missionId>/step-<N>-<slug>-#<issueNum> (§8 Path Law)
    const branch = `mission/${missionId}/step-${stepNum}-${slugify(description)}-#${issue.number}`;
    await createBranch(branch);
    console.log(`[GitHubTracer] Step #${issue.number} → branch: ${branch}`);
    return issue.number;
}
/**
 * closeMissionIssue: Closes the Epic Issue when the mission reaches a terminal state.
 * Why: Keeps the Issues tab clean — completed/failed missions do not accumulate as open issues.
 */
async function closeMissionIssue(issueNum, status) {
    await gh('PATCH', `/repos/${OWNER}/${REPO}/issues/${issueNum}`, {
        state: 'closed',
        state_reason: status === 'completed' ? 'completed' : 'not_planned',
    });
    console.log(`[GitHubTracer] Closed Epic issue #${issueNum} as ${status}`);
}
/** createBranch: Branches off HEAD of main per §8 Parent Integrity rule.
 *  Why: 409 conflict means the branch already exists — log and continue rather than fail. */
async function createBranch(name) {
    var _a;
    const ref = await gh('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/main`);
    const sha = (_a = ref === null || ref === void 0 ? void 0 : ref.object) === null || _a === void 0 ? void 0 : _a.sha;
    if (!sha) {
        console.warn('[GitHubTracer] Could not resolve main branch SHA — skipping branch creation.');
        return;
    }
    const result = await gh('POST', `/repos/${OWNER}/${REPO}/git/refs`, { ref: `refs/heads/${name}`, sha });
    if (!result)
        console.warn(`[GitHubTracer] Branch "${name}" may already exist or could not be created.`);
}
//# sourceMappingURL=github-tracer.service.js.map