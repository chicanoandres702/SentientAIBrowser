// Feature: Hosting | Why: Serve the Expo web build (dist/) on this Linux server
// with a zero-dependency Node static file server + SPA fallback to index.html.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, type, data) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(data);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'text/plain', 'Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      fs.readFile(filePath, (e, data) => {
        if (e) return send(res, 500, 'text/plain', 'Server Error');
        send(res, 200, type, data);
      });
      return;
    }
    // SPA fallback: serve index.html for unknown non-asset routes
    if (!path.extname(urlPath)) {
      const indexFile = path.join(ROOT, 'index.html');
      fs.readFile(indexFile, (e, data) => {
        if (e) return send(res, 404, 'text/plain', 'Not Found');
        send(res, 200, MIME['.html'], data);
      });
      return;
    }
    send(res, 404, 'text/plain', 'Not Found');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sentient AI Browser running at http://0.0.0.0:${PORT}`);
});
