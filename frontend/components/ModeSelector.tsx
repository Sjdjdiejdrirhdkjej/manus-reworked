'use client';

import React from 'react';
import type { Mode } from '@/app/types';

interface ModeSelectorProps {
  selectedMode: Mode;
  setSelectedMode: (mode: Mode) => void;
  desktopEnabled: boolean; // New prop
}

// Icons for the mode selector
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mode-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const CUAAgentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mode-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0h.008v.008h-.008M12 10.5h.008v.008H12m-3 2.25h.008v.008H9m6 0h.008v.008h-.008m-6 2.25h.008v.008H9m3 0h.008v.008H12m3 0h.008v.008h-.008" />
  </svg>
);

const HighEffortAgentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mode-icon">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L13.5 21.75 15 13.5H3.75z" />
  </svg>
);

const MODES: { id: Mode; label: string; icon: JSX.Element }[] = [
  { id: 'chat', label: 'Chat Mode', icon: <ChatIcon /> },
  { id: 'cua', label: 'CUA', icon: <CUAAgentIcon /> },
  { id: 'high-effort', label: 'High-Effort', icon: <HighEffortAgentIcon /> },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, setSelectedMode, desktopEnabled }) => {
  return (
    <div className="mode-selector">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => {
            if (desktopEnabled || mode.id === 'chat') {
              setSelectedMode(mode.id);
            }
          }}
          className={`mode-option group ${selectedMode === mode.id ? 'active' : ''} ${
            !desktopEnabled && mode.id !== 'chat' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label={mode.label}
          disabled={!desktopEnabled && mode.id !== 'chat'} // Disable if desktop is not enabled and it's not chat mode
        >
          {mode.icon}
          <span className="mode-tooltip">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;