// Feature: Workflow WebSocket Server | Trace: shared/workflow.websocket.server.js
const { wss, server } = require('./workflow.websocket.init');
const { verifyIdToken } = require('./workflow.websocket.auth');
const { getUserWorkflows } = require('./workflow.websocket.state');
const { broadcastNotification } = require('./workflow.websocket.notify');
const { handleBinaryMessage } = require('./workflow.websocket.binary');

wss.on('connection', ws => {
  ws.isAuthenticated = false;
  ws.user = null;
  ws.on('message', async message => {
    if (!ws.isAuthenticated) {
      let data;
      try { data = JSON.parse(message); } catch { ws.close(4001, 'Invalid auth message'); return; }
      if (data.type === 'auth' && data.idToken) {
        const user = await verifyIdToken(data.idToken);
        if (user) {
          ws.isAuthenticated = true;
          ws.user = user;
          ws.send(JSON.stringify({ type: 'auth', status: 'success', user }));
        } else { ws.close(4002, 'Invalid Google ID token'); }
      } else { ws.close(4003, 'Auth required'); }
      return;
    }
    let data;
    try { data = JSON.parse(message); } catch { handleBinaryMessage(wss, ws, message); return; }
    const workflows = getUserWorkflows(ws.user);
    if (data.type === 'workflowStart') {
      workflows[data.workflowId] = { status: 'running', result: null };
      broadcastNotification('info', `Workflow ${data.workflowId} started.`, ws.user.uid);
      return;
    }
    if (data.type === 'workflowStop') {
      if (workflows[data.workflowId]) workflows[data.workflowId].status = 'stopped';
      broadcastNotification('info', `Workflow ${data.workflowId} stopped.`, ws.user.uid);
      return;
    }
    if (data.type === 'workflowResult') {
      workflows[data.workflowId] = workflows[data.workflowId] || {};
      workflows[data.workflowId].result = data.result;
      workflows[data.workflowId].status = 'completed';
      broadcastNotification('success', `Workflow ${data.workflowId} completed: ${data.result}`, ws.user.uid);
      return;
    }
  });
});
server.listen(8080);
// ...existing code...
  debugLog('broadcastNotification called:', { type, message, userId });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
      if (!userId || client.user.uid === userId) {
        debugLog('Sending notification to client:', client.user.uid);
        client.send(JSON.stringify({ type: 'notification', notification: { type, message, timestamp: Date.now() } }));
      }
    }
  });
}
module.exports = {
  broadcastNotification,
  debugLog,
};


