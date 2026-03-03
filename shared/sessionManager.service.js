// Feature: Multi-User Session Manager | Trace: shared/sessionManager.service.js
const { launchWithUserData } = require('./playwrightUserData.service');

const sessions = {};
const sessionTimeouts = {};
const { ScreenshotStreamService } = require('./screenshotStream.service.ts');
const { streamWithFfmpeg } = require('./ffmpegStream.service.js');
const { logEvent } = require('./logger.service.js');

async function startSession(userId, userDataDir) {
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
