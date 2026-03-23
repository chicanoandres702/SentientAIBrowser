// Feature: Notification Broadcasting | Trace: shared/workflow.websocket.notify.js
function broadcastNotification(type, message, userId) {
  // Stub: Implement notification logic (e.g., push, email, UI)
  // For now, just log
  console.log(`[${type}] ${message} (user: ${userId})`);
}
module.exports = { broadcastNotification };
