// Feature: Binary Data Handler | Trace: shared/workflow.websocket.binary.js
function handleBinaryMessage(wss, ws, message) {
  wss.clients.forEach(client => {
    if (client.readyState === ws.OPEN && client.isAuthenticated) {
      client.send(message);
    }
  });
}
module.exports = { handleBinaryMessage };
