// Feature: WebSocket Auth | Trace: shared/workflow.websocket.auth.js
const admin = require('./firebaseAdmin');
async function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken).catch(() => null);
}
module.exports = { verifyIdToken };
