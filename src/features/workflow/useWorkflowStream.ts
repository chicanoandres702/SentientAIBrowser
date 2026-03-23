// Feature: Workflow Stream Player | Trace: src/features/workflow/WorkflowStreamPlayer.tsx
import { useEffect, useRef, useState } from 'react';

export function useWorkflowStream(wsUrl: string, type: 'screenshot' | 'video') {
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    let mediaSource: MediaSource | null = null;
    let sourceBuffer: SourceBuffer | null = null;
    let queue: Array<Uint8Array> = [];
    ws.onopen = () => {
      setStatus('live');
      if (type === 'video' && videoRef.current) {
        mediaSource = new MediaSource();
        videoRef.current.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener('sourceopen', () => {
          try {
            sourceBuffer = mediaSource!.addSourceBuffer('video/mp2t; codecs="mp2t, avc1.42E01E, mp2"');
            sourceBuffer.mode = 'segments';
            sourceBuffer.addEventListener('updateend', () => {
              if (queue.length > 0 && !sourceBuffer!.updating) {
                sourceBuffer!.appendBuffer(queue.shift()!);
              }
            });
          } catch (err) {
            setError('MediaSource error: ' + String(err));
          }
        });
      }
    };
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
      } else if (type === 'video' && videoRef.current && mediaSource && sourceBuffer) {
        const chunk = new Uint8Array(event.data);
        if (!sourceBuffer.updating) {
          try {
            sourceBuffer.appendBuffer(chunk);
          } catch (err) {
            setError('SourceBuffer error: ' + String(err));
          }
        } else {
          queue.push(chunk);
        }
      }
    };
    return () => {
      ws.close();
      if (mediaSource) {
        mediaSource.endOfStream();
      }
    };
  }, [wsUrl, type]);

  return { imgRef, videoRef, status, error };
}
