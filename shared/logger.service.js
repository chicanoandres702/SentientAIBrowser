/*
AIDDE TRACE HEADER
File: logger.service.js
Feature: Modular logging utility for workflow events
Why: Track events, errors, and analytics in Firestore
*/
const { getFirestore } = require('firebase-admin/firestore');

function logEvent(type, details) {
  const db = getFirestore();
  const entry = {
    type,
    details,
    timestamp: Date.now(),
  };
  db.collection('workflow_logs').add(entry).catch(err => {
    console.error('Firestore log error:', err);
  });
  // If details include userId and action, also log to user_analytics
  if (details && details.userId && details.action) {
    db.collection('user_analytics').add({
      userId: details.userId,
      action: details.action,
      timestamp: Date.now(),
      meta: details
    }).catch(err => {
      console.error('Firestore analytics error:', err);
    });
  }
}

module.exports = { logEvent };
