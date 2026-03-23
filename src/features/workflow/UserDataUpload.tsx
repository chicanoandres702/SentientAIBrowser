// Feature: User Data Upload UI | Trace: src/features/workflow/UserDataUpload.tsx
import React, { useRef } from 'react';

export const UserDataUpload: React.FC<{ ws: WebSocket; userId: string }> = ({ ws, userId }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      ws.send(JSON.stringify({
        type: 'userDataUpload',
        userId,
        buffer: Buffer.from(buffer).toString('base64'),
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <input type="file" ref={inputRef} onChange={handleFileChange} accept=".zip,.json" />
      <span>Upload your browser profile (.zip or cookies file)</span>
    </div>
  );
};
