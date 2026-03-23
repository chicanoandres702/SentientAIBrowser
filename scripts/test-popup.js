// Feature: System Utilities | Trace: scripts/test-popup.js
const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Popup Test Page</title>
</head>
<body style="font-family: sans-serif; padding: 50px;">
    <h1>Sentient Tab Interception Test</h1>
    <p>Clicking the buttons below should open a new tab entirely within the Sentient browser instead of opening a real Chrome pop-up.</p>
    
    <div style="margin-top: 30px;">
        <button onclick="window.open('https://example.com')" style="padding: 10px 20px; font-size: 16px;">Test window.open()</button>
    </div>
    
    <div style="margin-top: 30px;">
        <a href="https://example.com" target="_blank" style="display: inline-block; padding: 10px 20px; font-size: 16px; background: #eee; color: blue; text-decoration: none;">Test target="_blank"</a>
    </div>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
});

server.listen(4848, () => {
    console.log('Popup test server running at http://localhost:4848');
});
