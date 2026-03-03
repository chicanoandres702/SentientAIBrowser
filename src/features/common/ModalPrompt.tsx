/*
AIDDE TRACE HEADER
File: ModalPrompt.tsx
Feature: Interactive modal prompt for questions and options
Why: Provide actionable UI for questions, options, and user input
*/
import React, { useState } from 'react';

interface ModalPromptProps {
  question: string;
  options: string[];
  onSelect: (option: string, inputValue?: string) => void;
  showInput?: boolean;
  inputLabel?: string;
  onClose?: () => void;
}

export const ModalPrompt: React.FC<ModalPromptProps> = ({
  question,
  options,
  onSelect,
  showInput = false,
  inputLabel = 'Your answer:',
  onClose,
}) => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <h2 style={{ marginBottom: 16 }}>{question}</h2>
        {showInput && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>{inputLabel}</label>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {options.map(opt => (
            <button
              key={opt}
              style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#007bff', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => onSelect(opt, showInput ? inputValue : undefined)}
            >
              {opt}
            </button>
          ))}
        </div>
        {onClose && (
          <button style={{ marginTop: 24, background: 'none', color: '#888', border: 'none', cursor: 'pointer' }} onClick={onClose}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
