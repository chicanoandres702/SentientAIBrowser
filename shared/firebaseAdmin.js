// Feature: Firebase Admin | Trace: shared/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // Place your service account key here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
