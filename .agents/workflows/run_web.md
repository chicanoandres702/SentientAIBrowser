---
description: Start the web bundler and proxy server for web-based testing.
---

1. To run the web version of the application, we need to run both the Metro Web Bundler and the local backend Proxy Server that helps bypass CORS for iframes.
// turbo
2. Keep the proxy server running in the background and launch the web bundler.
```powershell
Start-Job -ScriptBlock { npm run proxy }
npm run web
```
