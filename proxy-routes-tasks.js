// Feature: System Utilities | Trace: README.md
const fs = require('fs');
const { TASKS_FILE } = require('./proxy-config');

function setupTaskRoutes(app) {
  app.get('/proxy/tasks', (req, res) => {
    if (!fs.existsSync(TASKS_FILE)) return res.json([]);
    try {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Failed to read tasks' });
    }
  });

  app.post('/proxy/tasks', (req, res) => {
    try {
      fs.writeFileSync(TASKS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to write tasks' });
    }
  });
}

module.exports = { setupTaskRoutes };
