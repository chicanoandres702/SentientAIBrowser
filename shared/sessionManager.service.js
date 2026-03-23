// Feature: Multi-User Session Manager | Trace: shared/sessionManager.service.js
const { launchWithUserData } = require('./playwrightUserData.service');

const sessions = {};
const sessionTimeouts = {};
const { ScreenshotStreamService } = require('./screenshotStream.service.ts');
const { streamWithFfmpeg } = require('./ffmpegStream.service.js');
const { logEvent } = require('./logger.service.js');

async function startSession(userId, userDataDir) {
    // AI confidence check for ambiguous session start
    if (userDataDir === 'ambiguous' || !userDataDir) {
      // Simulate modal trigger (in real use, send event to frontend)
      logEvent('ai_modal_trigger', {
        userId,
        action: 'startSession',
        options: ['Retry', 'Provide user data', 'Cancel'],
        question: 'AI is unsure how to start session. What should happen next?',
        confidence: 0.3
      });
      // Optionally, halt or wait for user input
      return null;
    }
  if (sessions[userId]) return sessions[userId];
  const context = await launchWithUserData(userDataDir);
  sessions[userId] = context;
  // Set session timeout (30 min)
  if (sessionTimeouts[userId]) clearTimeout(sessionTimeouts[userId]);
  sessionTimeouts[userId] = setTimeout(() => {
    endSession(userId);
  }, 30 * 60 * 1000);
  logEvent('session_start', { userId, userDataDir });
  return context;
}

// Start screenshot stream for a session
function startScreenshotStream(userId, wsUrl, intervalMs = 1000) {
    // AI confidence check for ambiguous screenshot stream
    if (!wsUrl || wsUrl === 'ambiguous') {
      logEvent('ai_modal_trigger', {
        userId,
        action: 'startScreenshotStream',
        options: ['Retry', 'Provide wsUrl', 'Cancel'],
        question: 'AI is unsure how to start screenshot stream. What should happen next?',
        confidence: 0.3
      });
      return null;
    }
  const context = sessions[userId];
  if (!context) throw new Error('Session not found');
  const page = context.pages()[0];
  const streamService = new ScreenshotStreamService(wsUrl);
  streamService.streamScreenshot(page, intervalMs);
  logEvent('screenshot_stream_start', { userId, wsUrl, intervalMs });
  return streamService;
}

// Start video stream for a session (stub)
function startVideoStream(userId, wsUrl, inputSource) {
    // AI confidence check for ambiguous video stream
    if (!inputSource || inputSource === 'ambiguous') {
      logEvent('ai_modal_trigger', {
        userId,
        action: 'startVideoStream',
        options: ['Retry', 'Provide input source', 'Cancel'],
        question: 'AI is unsure how to start video stream. What should happen next?',
        confidence: 0.3
      });
      return null;
    }
  // inputSource: video file or desktop capture path
  streamWithFfmpeg(inputSource, wsUrl);
  logEvent('video_stream_start', { userId, wsUrl, inputSource });
}

function endSession(userId) {
  if (sessions[userId]) {
    sessions[userId].close();
    if (sessionTimeouts[userId]) {
      clearTimeout(sessionTimeouts[userId]);
      delete sessionTimeouts[userId];
    }
    logEvent('session_end', { userId });
    delete sessions[userId];
  }
}

module.exports = {
  startSession,
  endSession,
  sessions,
  startScreenshotStream,
  startVideoStream
};
