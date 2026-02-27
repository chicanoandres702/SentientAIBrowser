// Feature: System Utilities | Trace: README.md
const fs = require('fs');
const express = require('express');
const { TASKS_FILE } = require('./proxy-config');

function setupTaskRoutes() {
  const router = express.Router();
  router.get('/', (req, res) => {
    if (!fs.existsSync(TASKS_FILE)) return res.json([]);
    try {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Failed to read tasks' });
    }
  });

  router.post('/', (req, res) => {
    try {
      fs.writeFileSync(TASKS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to write tasks' });
    }
  });
  return router;
}

module.exports = { setupTaskRoutes };
