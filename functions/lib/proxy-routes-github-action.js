"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGithubActionRoute = setupGithubActionRoute;
async function dispatchScrapeWorkflow(payload) {
    var _a, _b, _c, _d, _e;
    const owner = (_a = process.env.GH_REPO_OWNER) !== null && _a !== void 0 ? _a : 'chicanoandres702';
    const repo = (_b = process.env.GH_REPO_NAME) !== null && _b !== void 0 ? _b : 'SentientAIBrowser';
    const pat = (_c = process.env.GH_PAT) !== null && _c !== void 0 ? _c : '';
    if (!pat)
        throw new Error('GH_PAT env var is not set on Cloud Run');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
    const tabId = (_d = payload.tabId) !== null && _d !== void 0 ? _d : `gh_${Date.now()}`;
    const userId = (_e = payload.userId) !== null && _e !== void 0 ? _e : 'default';
    const body = {
        event_type: 'scrape',
        client_payload: { url: payload.url, tabId, userId },
    };
    const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${pat}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    // Why: repository_dispatch returns 204 No Content on success
    if (resp.status !== 204) {
        const text = await resp.text();
        throw new Error(`GitHub API ${resp.status}: ${text}`);
    }
    console.log(`[GHAction] ✅ Dispatched scrape for tabId=${tabId} url=${payload.url}`);
    return { message: 'Scrape dispatched', tabId };
}
function setupGithubActionRoute(app) {
    /**
     * POST /proxy/github-scrape { url, tabId?, userId? }
     * Why: Triggers the GitHub Actions Playwright workflow. Returns immediately;
     *      result appears in Firestore browser_tabs/{tabId} within ~30-60s.
     */
    app.post('/proxy/github-scrape', async (req, res) => {
        const { url, tabId, userId } = req.body;
        if (!url) {
            res.status(400).json({ error: 'url is required' });
            return;
        }
        try {
            const result = await dispatchScrapeWorkflow({ url, tabId, userId });
            res.json(Object.assign(Object.assign({}, result), { firestorePath: `browser_tabs/${result.tabId}` }));
        }
        catch (e) {
            console.error('[GHAction] ❌', e.message);
            res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-github-action.js.map