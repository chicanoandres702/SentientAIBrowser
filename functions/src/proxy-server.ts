// Feature: System Utilities | Trace: README.md
import * as http from 'http';
import * as net from 'net';
import express from 'express';
import cors from 'cors';
import { PORT, REMOTE_DEBUGGING_PORT } from './proxy-config';
import { setupBrowserRoutes } from './proxy-routes-browser';
import orchestrator from './backend-ai-orchestrator';

/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 */
const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});
app.use(express.json());

setupBrowserRoutes(app);

// Why: use http.createServer so we can intercept WebSocket upgrade events.
// Express's app.listen() doesn't expose the raw server needed for WS proxying.
const server = http.createServer(app);

/**
 * CDP WebSocket Proxy — /cdp-proxy/<path>
 * Why: Cloud Run only exposes port 8080 (HTTPS). Chrome's CDP runs on 9222 inside the
 * container. This handler raw-tunnels WebSocket upgrade frames from the public HTTPS
 * endpoint to localhost:9222 — making the Playwright session inspectable from any browser.
 *
 * Usage (desktop):  chrome://inspect → Configure → add <cloudrun-host>:443
 * Usage (mobile):   open the devtoolsUrl returned by GET /cdp/info in any browser
 */
server.on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    if (!req.url?.startsWith('/cdp-proxy')) {
        socket.destroy();
        return;
    }

    // Strip our proxy prefix so CDP gets the path it expects (e.g. /devtools/page/<id>)
    const cdpPath = req.url.replace('/cdp-proxy', '') || '/';

    const target = net.createConnection(REMOTE_DEBUGGING_PORT, '127.0.0.1');

    target.on('connect', () => {
        // Rebuild the HTTP upgrade request for the CDP server
        const headers = [
            `GET ${cdpPath} HTTP/1.1`,
            `Host: 127.0.0.1:${REMOTE_DEBUGGING_PORT}`,
            `Upgrade: websocket`,
            `Connection: Upgrade`,
            ...Object.entries(req.headers)
                .filter(([k]) => !['host', 'upgrade', 'connection'].includes(k.toLowerCase()))
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`),
            '',
            '',
        ].join('\r\n');

        target.write(headers);
        if (head?.length) target.write(head);
    });

    socket.pipe(target);
    target.pipe(socket);

    socket.on('error', () => target.destroy());
    socket.on('end', () => target.destroy());
    target.on('error', (e) => {
        console.warn('[CDP Proxy] tunnel error:', e.message);
        socket.destroy();
    });
    target.on('end', () => socket.destroy());
});

server.listen(PORT, () => {
  console.log(`[Sentient Proxy] Active at http://localhost:${PORT}`);
  console.log(`[CDP] DevTools available at GET /cdp/info after first navigation`);
  try {
    orchestrator.start();
  } catch (e: any) {
    console.warn(`[Sentient Proxy] Orchestrator skipped (${e.message}). Proxy routes still available.`);
  }
});
