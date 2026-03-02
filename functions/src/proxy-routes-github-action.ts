// Feature: GitHub Actions Trigger | Trace: .github/workflows/playwright-scrape.yml
// Why: Cloud Run endpoint that dispatches the on-demand Playwright scrape workflow.
//      Android app POSTs here; this calls the GitHub repository_dispatch API and returns
//      immediately — the result lands in Firestore when the Actions runner finishes (~30s).
//
// Required env vars (set on Cloud Run):
//   GH_PAT        — GitHub PAT with `repo` scope  (Settings → Secrets → GH_PAT)
//   GH_REPO_OWNER — e.g. chicanoandres702
//   GH_REPO_NAME  — e.g. SentientAIBrowser
import { Express, Request, Response } from 'express';

interface ScrapePayload {
  url: string;
  tabId?: string;
  userId?: string;
}

async function dispatchScrapeWorkflow(payload: ScrapePayload): Promise<{ tabId: string; message: string }> {
  const owner = process.env.GH_REPO_OWNER ?? 'chicanoandres702';
  const repo  = process.env.GH_REPO_NAME  ?? 'SentientAIBrowser';
  const pat   = process.env.GH_PAT ?? '';
  if (!pat) throw new Error('GH_PAT env var is not set on Cloud Run');

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  const tabId  = payload.tabId  ?? `gh_${Date.now()}`;
  const userId = payload.userId ?? 'default';

  const body = {
    event_type: 'scrape',
    client_payload: { url: payload.url, tabId, userId },
  };

  const resp = await fetch(apiUrl, {
    method:  'POST',
    headers: {
      Accept:        'application/vnd.github+json',
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

export function setupGithubActionRoute(app: Express): void {
  /**
   * POST /proxy/github-scrape { url, tabId?, userId? }
   * Why: Triggers the GitHub Actions Playwright workflow. Returns immediately;
   *      result appears in Firestore browser_tabs/{tabId} within ~30-60s.
   */
  app.post('/proxy/github-scrape', async (req: Request, res: Response): Promise<void> => {
    const { url, tabId, userId } = req.body as ScrapePayload & Record<string, string>;
    if (!url) { res.status(400).json({ error: 'url is required' }); return; }
    try {
      const result = await dispatchScrapeWorkflow({ url, tabId, userId });
      res.json({ ...result, firestorePath: `browser_tabs/${result.tabId}` });
    } catch (e: any) {
      console.error('[GHAction] ❌', e.message);
      res.status(500).json({ error: e.message });
    }
  });
}
