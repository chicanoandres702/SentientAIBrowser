// Feature: Migrate UserID Script | Trace: scripts/migrate-userid.js
// Firestore migration script: user_id → userId
// Usage: node migrate-userid.js
// Requires: GOOGLE_APPLICATION_CREDENTIALS set to your Firebase service account key

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrateCollection(collection) {
  const snapshot = await db.collection(collection).get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.user_id && !data.userId) {
      await doc.ref.update({
        userId: data.user_id,
        user_id: admin.firestore.FieldValue.delete()
      });
      updated++;
      console.log(`[${collection}] Migrated doc ${doc.id}`);
    }
  }
  console.log(`[${collection}] Migration complete. Updated: ${updated}`);
}

async function main() {
  const collections = ['browser_tabs', 'task_queues', 'missions', 'thoughts', 'user_knowledge', 'mission_outcomes', 'routines', 'user_sessions'];
  for (const col of collections) {
    await migrateCollection(col);
  }
  console.log('All migrations complete.');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
