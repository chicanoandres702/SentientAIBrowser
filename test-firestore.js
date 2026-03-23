// Feature: Firestore Diagnostics | Trace: README.md
const admin = require('firebase-admin');

// Initialize Firebase Admin for the specific project
admin.initializeApp({
  projectId: 'sentient-ai-browser'
});

const db = admin.firestore();

async function testConnection() {
  console.log('Testing Firestore connection for project: sentient-ai-browser...');
  try {
    const docRef = db.collection('test_connection').doc('ping');
    await docRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
    console.log('Successfully wrote to Firestore! The database is active and accessible.');
    
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      console.log('Successfully read from Firestore:', docSnap.data());
    }
  } catch (error) {
    console.error('Firestore Connection Error:');
    console.error(error);
  }
}

testConnection();
