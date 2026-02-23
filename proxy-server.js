const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Proxy endpoint
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL query parameter is required');
    }

    console.log(`Proxying request to: ${targetUrl}`);

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
                'Upgrade-Insecure-Requests': '1',
                'Connection': 'keep-alive',
            },
            maxRedirects: 10,
            validateStatus: () => true
        });

        // Strip security headers that block iframes
        const headers = { ...response.headers };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        delete headers['content-security-policy-report-only'];

        // Forward headers and content
        res.set(headers);
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).send(`Failed to proxy request: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Sentient Browser Local Proxy running at http://localhost:${PORT}`);
    console.log(`Usage: http://localhost:${PORT}/proxy?url=https://google.com`);
});
