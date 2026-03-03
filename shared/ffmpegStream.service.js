// Feature: ffmpeg Real-Time Stream | Trace: shared/ffmpegStream.service.js
const { spawn } = require('child_process');
const WebSocket = require('ws');

function streamWithFfmpeg(inputSource, wsUrl) {
  // Example: inputSource can be a video file or desktop capture
  // ffmpeg command for WebSocket streaming (raw MPEG-TS)
  const ffmpeg = spawn('ffmpeg', [
    '-i', inputSource,
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-b:v', '1000k',
    '-r', '30',
    '-an',
    '-'
  ]);

  const ws = new WebSocket(wsUrl);
  ws.on('open', () => {
    ffmpeg.stdout.on('data', chunk => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    });
    ffmpeg.stdout.on('end', () => ws.close());
  });

  ws.on('error', err => {
    console.error('WebSocket error:', err);
    ffmpeg.kill();
  });
  ws.on('close', () => {
    ffmpeg.kill();
  });

  ffmpeg.stderr.on('data', data => {
    console.error('ffmpeg error:', data.toString());
  });

  ffmpeg.on('close', code => {
    console.log('ffmpeg exited with code', code);
  });
}

module.exports = { streamWithFfmpeg };
