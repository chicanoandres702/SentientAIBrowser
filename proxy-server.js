// Feature: System Utilities | Trace: README.md
// Why: PM2 manages process lifecycle; internal cluster forking creates
// unwanted visible Node windows on Windows. Single-process is correct here.
const express = require('express');
const cors = require('cors');
const { PORT } = require('./proxy-config');
const { setupTaskRoutes } = require('./proxy-routes-tasks');
const { setupGitRoutes } = require('./proxy-routes-git');
const { setupBrowserRoutes } = require('./proxy-routes-browser');

const app = express();
app.use(cors());

// Why: Capture rawBody for structured types
app.use(express.json({ limit: '50mb', verify: (req, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '50mb', verify: (req, buf) => { req.rawBody = buf; } }));

// Why: Catch-all raw parser for binary (protobuf), XML, or weird Google-encoded JSON
// This runs if the content-type was NOT handled by the above parsers.
app.use(express.raw({ type: '*/*', limit: '50mb', verify: (req, buf) => { req.rawBody = buf; } }));

setupTaskRoutes(app);
setupGitRoutes(app);
setupBrowserRoutes(app);

app.listen(PORT, () => {

  console.log(`[Sentient Proxy] Active at http://localhost:${PORT}`);
});
