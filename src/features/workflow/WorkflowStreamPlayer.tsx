/*
AIDDE TRACE HEADER
File: WorkflowStreamPlayer.tsx
Feature: Frontend component for live screenshot/video stream
Why: Display real-time workflow streams in UI
*/
import React, { useEffect, useRef } from 'react';
import NotificationBanner from '../common/NotificationBanner';

interface Props {
  wsUrl: string;
  type: 'screenshot' | 'video';
}

const WorkflowStreamPlayer: React.FC<Props> = ({ wsUrl, type }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = React.useState<'connecting' | 'live' | 'error'>('connecting');
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => setStatus('live');
    ws.onerror = (e) => {
      setStatus('error');
      setError('WebSocket connection error');
    };
    ws.onclose = () => {
      setStatus('error');
      setError('WebSocket closed');
    };
    ws.onmessage = (event) => {
      if (type === 'screenshot' && imgRef.current) {
        const blob = new Blob([event.data], { type: 'image/png' });
        imgRef.current.src = URL.createObjectURL(blob);
      } else if (type === 'video' && videoRef.current) {
        // For demo: append chunks to MediaSource (advanced)
        // Placeholder: video streaming integration
      }
    };
    return () => ws.close();
  }, [wsUrl, type]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <NotificationBanner />
      <div aria-live="polite" style={{ marginBottom: 8 }}>
        {status === 'connecting' && <span style={{ color: '#888' }}>Connecting...</span>}
        {status === 'live' && <span style={{ color: 'green' }}>Live</span>}
        {status === 'error' && <span style={{ color: 'red' }}>Error: {error}</span>}
      </div>
      {type === 'screenshot' ? (
        <img
          ref={imgRef}
          alt="Live Screenshot"
          style={{
            width: '100%',
            maxWidth: '100%',
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          tabIndex={0}
        />
      ) : (
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{
            width: '100%',
            maxWidth: '100%',
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          tabIndex={0}
        />
      )}
    </div>
  );
};

export default WorkflowStreamPlayer;
