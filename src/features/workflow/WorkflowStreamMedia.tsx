// Feature: Workflow Stream Player | Trace: src/features/workflow/WorkflowStreamPlayer.tsx
import React from 'react';

interface Props {
  type: 'screenshot' | 'video';
  imgRef: React.RefObject<HTMLImageElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const WorkflowStreamMedia: React.FC<Props> = ({ type, imgRef, videoRef }) => (
  type === 'screenshot' ? (
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
  )
);
