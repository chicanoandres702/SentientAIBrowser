/*
AIDDE TRACE HEADER
File: admin.api.js
Feature: Admin API for session and stream monitoring
Why: Enable real-time admin controls and monitoring
*/
const express = require('express');
const { getUserRole } = require('./userRole.service');
const router = express.Router();
const { sessions } = require('./sessionManager.service');

// List active sessions
router.get('/admin/sessions', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (getUserRole(userId) !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  res.json({ sessions: Object.keys(sessions) });
});

// List session details
router.get('/admin/session/:userId', (req, res) => {
  const adminId = req.headers['x-user-id'];
  if (getUserRole(adminId) !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { userId } = req.params;
  const session = sessions[userId];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ userId, pages: session.pages().map(p => p.url()) });
});

module.exports = router;
// Terminate session
router.post('/admin/session/:userId/terminate', (req, res) => {
  const adminId = req.headers['x-user-id'];
  if (getUserRole(adminId) !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { userId } = req.params;
  const { endSession } = require('./sessionManager.service');
  endSession(userId);
  res.json({ status: 'terminated', userId });
});
