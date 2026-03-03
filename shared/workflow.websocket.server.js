const { handleUserDataUpload } = require('./userDataUpload.handler');
const admin = require('./firebaseAdmin');
// Map userId to uploaded user data path
let userDataPaths = {};
    // Handle user data upload (binary message)
    if (data.type === 'userDataUpload' && data.userId && data.buffer) {
      // Save user data and map to userId
      const filePath = handleUserDataUpload(data.userId, Buffer.from(data.buffer, 'base64'));
      userDataPaths[data.userId] = filePath;
      ws.send(JSON.stringify({ type: 'userDataUpload', status: 'success', filePath }));
      return;
    }
    // On workflow start, mount user data for Playwright session
    if (data.type === 'workflowStart') {
      const userId = ws.user.uid;
      const userDataDir = userDataPaths[userId];
      // TODO: Launch Playwright with userDataDir for this user
      // Save workflow start to Firestore
      admin.firestore().collection('user_workflows').add({
        userId,
        workflowId: data.workflowId,
        status: 'running',
        startedAt: Date.now()
      });
      broadcastNotification('info', `Workflow ${data.workflowId} started.`, userId);
      // ...existing broadcast logic...
    }
    // On workflow result, save to Firestore
    if (data.type === 'workflowResult') {
      const userId = ws.user.uid;
      admin.firestore().collection('user_workflows').add({
        userId,
        workflowId: data.workflowId,
        result: data.result,
        status: 'completed',
        completedAt: Date.now()
      });
      broadcastNotification('success', `Workflow ${data.workflowId} completed: ${data.result}`, userId);
      // ...existing broadcast logic...
    }
// Map workflowId to Playwright page/session (stub for demo)
let workflowPages = {};
    // Handle keystroke events
    if (data.type === 'keystroke') {
      // Find Playwright page/session for active tab/workflow
      const page = workflowPages[data.tab];
      if (page) {
        // Inject keystroke into Playwright browser
        page.keyboard.press(data.key).catch(console.error);
      }
      // Optionally broadcast keystroke to other clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(JSON.stringify({
            type: 'keystroke',
            key: data.key,
            code: data.code,
            tab: data.tab,
            user: ws.user
          }));
        }
      });
      broadcastNotification('info', `Keystroke ${data.key} sent to tab ${data.tab}.`, ws.user.uid);
      return;
    }
// Feature: Workflow WebSocket Server | Trace: shared/workflow.websocket.server.js

wss.on('connection', ws => {

const WebSocket = require('ws');
const http = require('http');
const admin = require('./firebaseAdmin');

const server = http.createServer();
const wss = new WebSocket.Server({ server });


// Store workflow state and results per user
let userWorkflows = {};
let activeTabStreams = {};

function verifyIdToken(idToken) {
  return admin.auth().verifyIdToken(idToken).catch(() => null);
}

wss.on('connection', ws => {
  ws.isAuthenticated = false;
  ws.user = null;

  // Helper: get user workflows
  function getUserWorkflows() {
    if (!ws.user) return {};
    if (!userWorkflows[ws.user.uid]) userWorkflows[ws.user.uid] = {};
    return userWorkflows[ws.user.uid];
  }

  ws.on('message', async message => {
    // First message must be { type: 'auth', idToken }
    if (!ws.isAuthenticated) {
      let data;
      try {
        data = JSON.parse(message);
      } catch {
        ws.close(4001, 'Invalid auth message');
        return;
      }
      if (data.type === 'auth' && data.idToken) {
        const user = await verifyIdToken(data.idToken);
        if (user) {
          ws.isAuthenticated = true;
          ws.user = user;
          ws.send(JSON.stringify({ type: 'auth', status: 'success', user }));
        } else {
          ws.close(4002, 'Invalid Google ID token');
        }
      } else {
        ws.close(4003, 'Auth required');
      }
      return;
    }

    // Try to parse JSON, fallback to binary
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      // Binary screenshot/image data
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(message);
        }
      });
      return;
    }


    // Workflow start
    if (data.type === 'workflowStart') {
      const workflows = getUserWorkflows();
      workflows[data.workflowId] = { status: 'running', result: null };
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(JSON.stringify({
            type: 'workflowStatus',
            workflowId: data.workflowId,
            status: 'running',
            user: ws.user
          }));
        }
      });
      broadcastNotification('info', `Workflow ${data.workflowId} started.`, userId);
      return;
    }

    // Workflow stop
    if (data.type === 'workflowStop') {
      const workflows = getUserWorkflows();
      if (workflows[data.workflowId]) {
        workflows[data.workflowId].status = 'stopped';
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
            client.send(JSON.stringify({
              type: 'workflowStatus',
              workflowId: data.workflowId,
              status: 'stopped',
              user: ws.user
            }));
          }
        });
      }
      return;
    }

    // Workflow result
    if (data.type === 'workflowResult') {
      const workflows = getUserWorkflows();
      workflows[data.workflowId] = workflows[data.workflowId] || {};
      workflows[data.workflowId].result = data.result;
      workflows[data.workflowId].status = 'completed';
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(JSON.stringify({
            type: 'workflowResult',
            workflowId: data.workflowId,
            result: data.result,
            status: 'completed',
            user: ws.user
          }));
        }
      });
      broadcastNotification('success', `Workflow ${data.workflowId} completed: ${data.result}`, userId);
      return;
    }

    // Workflow error
    if (data.type === 'workflowError') {
      const workflows = getUserWorkflows();
      workflows[data.workflowId] = workflows[data.workflowId] || {};
      workflows[data.workflowId].status = 'error';
      workflows[data.workflowId].error = data.error;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(JSON.stringify({
            type: 'workflowError',
            workflowId: data.workflowId,
            error: data.error,
            user: ws.user
          }));
        }
      });
      return;
    }

    // Workflow status query
    if (data.type === 'workflowStatusQuery') {
      const workflows = getUserWorkflows();
      ws.send(JSON.stringify({
        type: 'workflowStatusQuery',
        workflows,
        user: ws.user
      }));
      return;
    }

    // Handle tab state changes
    if (data.type === 'tabState') {
      // Track active tab per user
      activeTabStreams[ws.user.uid] = data.activeTab;
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
          client.send(JSON.stringify({
            type: 'tabState',
            activeTab: data.activeTab,
            user: ws.user
          }));
        }
      });
      // TODO: Trigger backend logic to start/stop video stream for active tab
    }

    // Handle workflow control (start/stop)
    if (data.type === 'workflowControl') {
      console.log(`Workflow control: ${data.action} for ${data.workflowId} by ${ws.user.email}`);
    }
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on ws://localhost:8080 with Google Auth');
});

// Notification broadcast utility
function broadcastNotification(type, message, userId = null) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
      if (!userId || client.user.uid === userId) {
        client.send(JSON.stringify({ type: 'notification', notification: { type, message, timestamp: Date.now() } }));
      }
    }
  });
}
