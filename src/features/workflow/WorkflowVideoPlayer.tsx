// Feature: Workflow Video Player | Trace: src/features/workflow/WorkflowVideoPlayer.tsx
import React, { useRef, useEffect } from 'react';

export const WorkflowVideoPlayer: React.FC<{ streamUrl: string; pseudoCursor: { x: number; y: number } }> = ({ streamUrl, pseudoCursor }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.controls = false;
    }
  }, [streamUrl]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src={streamUrl}
        autoPlay
        style={{ width: '100%', height: '100%', background: '#000' }}
      />
      {/* Pseudo cursor overlay */}
      <div
        style={{
          position: 'absolute',
          left: pseudoCursor.x,
          top: pseudoCursor.y,
          width: 24,
          height: 24,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <svg width="24" height="24">
          <circle cx="12" cy="12" r="8" fill="#007bff" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
};
