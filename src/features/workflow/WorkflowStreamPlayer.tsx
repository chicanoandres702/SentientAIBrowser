// Feature: Workflow Stream Player | Trace: src/features/workflow/WorkflowStreamPlayer.tsx
/*
AIDDE TRACE HEADER
File: WorkflowStreamPlayer.tsx
Feature: Frontend component for live screenshot/video stream
Why: Display real-time workflow streams in UI
*/
import React from 'react';
import { useWorkflowStream } from './useWorkflowStream';
import { WorkflowStreamStatus } from './WorkflowStreamStatus';
import { WorkflowStreamMedia } from './WorkflowStreamMedia';

interface Props {
  wsUrl: string;
  type: 'screenshot' | 'video';
}

const WorkflowStreamPlayer: React.FC<Props> = ({ wsUrl, type }) => {
  const { imgRef, videoRef, status, error } = useWorkflowStream(wsUrl, type);
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
      <WorkflowStreamStatus status={status} error={error} />
      <WorkflowStreamMedia type={type} imgRef={imgRef} videoRef={videoRef} />
    </div>
  );
};

export default WorkflowStreamPlayer;
