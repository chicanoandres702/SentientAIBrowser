const admin = require('firebase-admin');

// Initialize Firebase Admin for the specific project
admin.initializeApp({
  projectId: 'sentient-ai-browser'
});

const db = admin.firestore();

async function checkTabs() {
  console.log('Checking browser_tabs in sentient-ai-browser...');
  try {
    const tabsSnapshot = await db.collection('browser_tabs').get();
    if (tabsSnapshot.empty) {
      console.log('NO TABS FOUND IN FIRESTORE.');
    } else {
      console.log(`Found ${tabsSnapshot.size} tabs:`);
      tabsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Tab ID: ${doc.id}`);
        console.log(`  URL: ${data.url}`);
        console.log(`  User ID: ${data.user_id}`);
        console.log(`  Has Screenshot: ${!!data.screenshot}`);
        if (data.screenshot) {
            console.log(`  Screenshot length: ${data.screenshot.length}`);
        }
      });
    }
    
    const taskQueuesShot = await db.collectionGroup('task_queues').get();
    console.log(`Found ${taskQueuesShot.size} task queue items.`);
    
  } catch (error) {
    console.error('Firestore Query Error:');
    console.error(error);
  }
}

checkTabs();
