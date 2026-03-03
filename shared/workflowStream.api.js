/*
AIDDE TRACE HEADER
File: workflowStream.api.js
Feature: API handler for screenshot/video streaming
Why: Expose endpoints for frontend to trigger and receive streams
*/
const express = require('express');
const router = express.Router();
const { startScreenshotStream, startVideoStream } = require('./sessionManager.service');

// Start screenshot stream for a session
router.post('/stream/screenshot', (req, res) => {
  const { userId, wsUrl, intervalMs } = req.body;
  try {
    startScreenshotStream(userId, wsUrl, intervalMs || 1000);
    res.json({ status: 'started' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start video stream for a session
router.post('/stream/video', (req, res) => {
  const { userId, wsUrl, inputSource } = req.body;
  try {
    startVideoStream(userId, wsUrl, inputSource);
    res.json({ status: 'started' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
