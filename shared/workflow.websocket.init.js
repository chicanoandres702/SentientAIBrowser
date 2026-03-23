// Feature: WebSocket Server Init | Trace: shared/workflow.websocket.init.js
const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });
module.exports = { wss, server };
