# Sentient Proxy — External API Reference

The proxy runs a real **Chromium browser** (Playwright) on Cloud Run. Every endpoint navigates Chrome to the target URL, waits for JS to finish rendering, then returns the result.

---

## Base URL

```
https://sentient-proxy-184717935920.us-central1.run.app
```

---

## Authentication

The two external endpoints (`/api/render`, `/api/extract`) require an API key.  
All other endpoints (`/proxy`, `/screenshot`, etc.) are unauthenticated.

Pass the key in either way:

```
x-api-key: YOUR_KEY
```
or
```
?apiKey=YOUR_KEY
```

Keys are set via the `PROXY_API_KEY` env var on Cloud Run (comma-separated for multiple keys).  
If `PROXY_API_KEY` is not set, all requests pass through (local dev mode).

---

## Endpoints

### `GET /api/render` — JS-rendered HTML *(auth required)*

Returns the **fully rendered HTML** of a page — no link rewriting, no injected scripts. All `<a href>` links are rewritten to route back through this proxy so navigation chains work.

```
GET /api/render?url=<encoded_url>&tabId=<optional>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `url` | Yes | — | URL-encoded target URL |
| `tabId` | No | `external` | Named persistent browser tab |

**Response:** `text/html`

#### curl
```bash
curl "https://sentient-proxy-184717935920.us-central1.run.app/api/render?url=https%3A%2F%2Fwww.bbc.com" \
  -H "x-api-key: YOUR_KEY"
```

#### Python
```python
import requests

PROXY = "https://sentient-proxy-184717935920.us-central1.run.app"
KEY   = "YOUR_KEY"

html = requests.get(
    f"{PROXY}/api/render",
    params={"url": "https://www.bbc.com"},
    headers={"x-api-key": KEY},
    timeout=30,
).text
```

#### Node.js
```typescript
const html = await fetch(
    `https://sentient-proxy-184717935920.us-central1.run.app/api/render?url=${encodeURIComponent("https://www.bbc.com")}`,
    { headers: { "x-api-key": "YOUR_KEY" } }
).then(r => r.text());
```

---

### `GET /api/extract` — Structured JSON *(auth required)*

Returns **structured data** extracted from the fully-rendered page. Ideal for LLM context windows and AI agents.

```
GET /api/extract?url=<encoded_url>&tabId=<optional>
```

**Response shape:**
```json
{
  "url": "https://www.bbc.com/",
  "title": "BBC - Home",
  "text": "Full visible page text up to 50 000 chars...",
  "links": [
    { "text": "News", "href": "https://www.bbc.com/news" }
  ],
  "elements": [
    { "id": 1, "tag": "button", "text": "Sign in", "type": "submit" }
  ]
}
```

`elements[].id` matches the `data-ai-id` attribute stamped on the live page — use it with `/proxy/action` to click or type on that element.

#### curl
```bash
curl "https://sentient-proxy-184717935920.us-central1.run.app/api/extract?url=https%3A%2F%2Fwww.bbc.com" \
  -H "x-api-key: YOUR_KEY"
```

#### Python
```python
data = requests.get(
    f"{PROXY}/api/extract",
    params={"url": "https://www.bbc.com", "tabId": "bbc-session"},
    headers={"x-api-key": KEY},
    timeout=30,
).json()

print(data["title"])
for link in data["links"][:5]:
    print(link["href"], "—", link["text"])
```

---

### `GET /proxy` — Proxied browser view *(unauthenticated)*

Returns fully rendered HTML with links rewritten to continue routing through the proxy. Used by the internal browser UI.

```
GET /proxy?url=<encoded_url>&tabId=<optional>
```

All `<a href>` links are automatically rewritten to `<this-host>/proxy?url=...` so every click stays inside the proxy.

#### curl
```bash
curl "https://sentient-proxy-184717935920.us-central1.run.app/proxy?url=https%3A%2F%2Fwww.bbc.com"
```

---

### `GET /screenshot` — JPEG screenshot *(unauthenticated)*

```
GET /screenshot?tabId=<tab>&url=<optional_url>
```

**Response:** `application/json` → `{ "screenshot": "data:image/jpeg;base64,..." }`

---

### `GET /health` — Health check *(unauthenticated)*

```
GET /health
```

**Response:** `{ "status": "ok", "activeTabs": ["default", ...], "uptime": 123 }`

---

## Named Tabs (Sessions)

Every tab identified by `tabId` is a **persistent browser context** — cookies, login state, and navigation history survive across requests.

```python
# Log in
html = requests.get(f"{PROXY}/api/render",
    params={"url": "https://example.com/login", "tabId": "my-session"},
    headers={"x-api-key": KEY}).text

# Navigate — same tab, still logged in
html2 = requests.get(f"{PROXY}/api/render",
    params={"url": "https://example.com/dashboard", "tabId": "my-session"},
    headers={"x-api-key": KEY}).text
```

Use different `tabId` values to run parallel independent sessions.

---

## Link Rewriting

Every `<a href>` in `/proxy` and `/api/render` responses is rewritten to:

```
<this-host>/proxy?tabId=<tabId>&url=<absolute-encoded-url>
```

The host is derived from the **incoming request** (`req.protocol://req.host`), so it works correctly on Cloud Run, custom domains, and local dev — no hardcoded URLs.

Set `PUBLIC_PROXY_URL` env var to override (useful behind a load balancer that strips the original host header).

---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Missing `url` param |
| `401` | Missing or invalid API key |
| `500` | Page navigation or render failed — body contains the error |
| `502` | Cloud Run cold start or OOM — retry once after 3s |
| `503` | No active session for that `tabId` |

### Retry pattern (Python)
```python
import time, requests

def render(url: str, retries: int = 2) -> str:
    for attempt in range(retries):
        try:
            r = requests.get(f"{PROXY}/api/render",
                params={"url": url}, headers={"x-api-key": KEY}, timeout=30)
            r.raise_for_status()
            return r.text
        except requests.HTTPError as e:
            if e.response.status_code == 502 and attempt < retries - 1:
                time.sleep(3)
            else:
                raise
```

---

## Performance Notes

- **First call to a new `tabId`** — includes Chrome context creation (~1-2s extra)
- **Subsequent calls to the same `tabId`** — tab is already warm and navigated, faster
- **`networkidle` timeout** — 15s cap; pages with persistent websockets (Twitter, Gmail) hit this but still return rendered content
- **Cold start** — Cloud Run spins down at 0 instances; first request after idle takes ~5-10s


---

## Base URL

```
https://sentient-proxy-184717935920.us-central1.run.app
```

---

## The Endpoint

```
GET /proxy?url=<encoded_url>&tabId=<optional_tab_name>
```

| Param | Required | Description |
|-------|----------|-------------|
| `url` | **Yes** | URL-encoded target URL |
| `tabId` | No | Reuse a named browser tab (default: `"default"`) |

**Response:** `text/html` — full rendered page with all JS output baked in, `data-ai-id` attributes on interactive elements, and links rewritten to route back through the proxy.

---

## Examples

### curl

```bash
curl "https://sentient-proxy-184717935920.us-central1.run.app/proxy?url=https%3A%2F%2Fwww.bbc.com" \
  -o bbc_rendered.html
```

Save to a variable:
```bash
HTML=$(curl -s "https://sentient-proxy-184717935920.us-central1.run.app/proxy?url=https%3A%2F%2Fwww.bbc.com")
echo "$HTML" | grep -o '<title>[^<]*</title>'
```

### Python

```python
import requests
from urllib.parse import quote

PROXY = "https://sentient-proxy-184717935920.us-central1.run.app"

def get_rendered_html(url: str, tab_id: str = "default") -> str:
    resp = requests.get(
        f"{PROXY}/proxy",
        params={"url": url, "tabId": tab_id},
        timeout=30,         # networkidle wait can take up to 15s
    )
    resp.raise_for_status()
    return resp.text

# Usage
html = get_rendered_html("https://www.bbc.com")
print(html[:500])
```

Parse it with BeautifulSoup:
```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "html.parser")

# All interactive elements have data-ai-id set by the proxy
buttons = soup.find_all(attrs={"data-ai-id": True})
for el in buttons:
    print(el.get("data-ai-id"), el.name, el.get_text(strip=True)[:60])
```

### Node.js / TypeScript

```typescript
const PROXY = "https://sentient-proxy-184717935920.us-central1.run.app";

async function getRenderedHtml(url: string, tabId = "default"): Promise<string> {
    const res = await fetch(
        `${PROXY}/proxy?url=${encodeURIComponent(url)}&tabId=${encodeURIComponent(tabId)}`
    );
    if (!res.ok) throw new Error(`Proxy error ${res.status}: ${await res.text()}`);
    return res.text();
}

// Usage
const html = await getRenderedHtml("https://www.bbc.com");
console.log(html.slice(0, 500));
```

With cheerio (server-side jQuery):
```typescript
import * as cheerio from "cheerio";

const $ = cheerio.load(html);

// All interactive elements have data-ai-id attributes
$("[data-ai-id]").each((_, el) => {
    console.log($(el).attr("data-ai-id"), el.tagName, $(el).text().trim().slice(0, 60));
});

// Extract article headlines
$("h1, h2, h3").each((_, el) => {
    console.log($(el).text().trim());
});
```

### PowerShell

```powershell
$url = [System.Uri]::EscapeDataString("https://www.bbc.com")
$html = Invoke-RestMethod "https://sentient-proxy-184717935920.us-central1.run.app/proxy?url=$url"
$html | Out-File -FilePath "bbc_rendered.html" -Encoding utf8
```

---

## Using Named Tabs

Each `tabId` is a persistent browser tab. Reusing the same `tabId` keeps the session alive (cookies, login state) between requests:

```python
# First call — navigates to the page, waits for render
html1 = get_rendered_html("https://example.com/login", tab_id="my-session")

# Later call on the same tab — already logged in, uses existing session
html2 = get_rendered_html("https://example.com/dashboard", tab_id="my-session")
```

Use different `tabId` values to run multiple independent sessions in parallel:
```python
import concurrent.futures

urls = ["https://bbc.com", "https://cnn.com", "https://reuters.com"]

with concurrent.futures.ThreadPoolExecutor() as pool:
    results = list(pool.map(
        lambda u: get_rendered_html(u, tab_id=u.replace("https://", "").replace("/", "_")),
        urls
    ))
```

---

## What's Different vs Raw HTML

| Feature | `curl url` (raw) | `GET /proxy?url=` (rendered) |
|---------|-----------------|------------------------------|
| HTML from server | ✅ | ✅ |
| JS-rendered content | ❌ | ✅ |
| React / Vue / Angular output | ❌ | ✅ |
| Lazy-loaded data | ❌ | ✅ |
| `data-ai-id` on buttons/links | ❌ | ✅ |
| Persistent session / cookies | ❌ | ✅ (per tabId) |
| Bot detection bypassed | ❌ | ✅ (stealth context) |

---

## Timeouts & Performance

- The proxy waits up to **15 seconds** for `networkidle` before returning whatever is rendered
- Pages with persistent websockets / polling (Twitter, Gmail) will always hit the 15s cap — the rendered content is still returned, just cut off at that point
- Subsequent calls to the **same `tabId`** are faster — the tab is already open and warmed up
- First call to a new `tabId` includes Chrome context creation (~1-2s extra)

---

---

## External API (Auth-Protected)

These endpoints are designed for **server-to-server / external use**. Unlike `/proxy`, they return clean content — no link rewriting, no scanner script injection.

### Authentication

Set the `PROXY_API_KEY` environment variable on the Cloud Run container (comma-separated for multiple keys):

```
PROXY_API_KEY=my-secret-key-1,my-secret-key-2
```

Pass the key via header **or** query param on every request:

```
x-api-key: my-secret-key-1
```
or
```
?apiKey=my-secret-key-1
```

> **If `PROXY_API_KEY` is not set, all requests are allowed through** (useful for local dev).

---

### `GET /api/render` — Clean JS-Rendered HTML

Returns fully JS-rendered HTML with **no link rewriting and no scanner injection**. Ideal for scraping pipelines, AI ingestion, and server-side HTML parsing.

```
GET /api/render?url=<encoded_url>&tabId=<optional>
```

```bash
curl "https://sentient-proxy-184717935920.us-central1.run.app/api/render?url=https%3A%2F%2Fwww.bbc.com" \
  -H "x-api-key: my-secret-key-1"
```

```python
import requests

html = requests.get(
    "https://sentient-proxy-184717935920.us-central1.run.app/api/render",
    params={"url": "https://www.bbc.com"},
    headers={"x-api-key": "my-secret-key-1"},
    timeout=30,
).text
```

---

### `GET /api/extract` — Structured JSON

Returns structured data extracted from the fully-rendered page. Perfect for LLM context windows and AI agents.

```
GET /api/extract?url=<encoded_url>&tabId=<optional>
```

**Response shape:**
```json
{
  "url": "https://www.bbc.com/",
  "title": "BBC - Home",
  "text": "Full visible page text, up to 50 000 chars...",
  "links": [
    { "text": "News", "href": "https://www.bbc.com/news" }
  ],
  "elements": [
    { "id": 1, "tag": "button", "text": "Sign in", "type": "submit" }
  ]
}
```

`elements` also have `data-ai-id` set on the live page, so you can use the IDs with `/proxy/action` or `/proxy/click` immediately after.

```python
import requests

data = requests.get(
    "https://sentient-proxy-184717935920.us-central1.run.app/api/extract",
    params={"url": "https://www.bbc.com", "tabId": "bbc-session"},
    headers={"x-api-key": "my-secret-key-1"},
    timeout=30,
).json()

print(data["title"])
for link in data["links"][:5]:
    print(link["href"], "—", link["text"])
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Missing `url` param |
| `500` | Page navigation or render failed — body contains the error message |
| `502` | Cloud Run container OOM or cold-start timeout — retry once |

For 502s: the container needs a moment to spin up Chrome on a cold start. A single retry with a 3-second delay is usually enough:

```python
import time

def get_rendered_html_with_retry(url: str, retries: int = 2) -> str:
    for attempt in range(retries):
        try:
            return get_rendered_html(url)
        except requests.HTTPError as e:
            if e.response.status_code == 502 and attempt < retries - 1:
                time.sleep(3)
            else:
                raise
```
