import React from 'react';
import type { Thinking } from '@/app/types';

interface ThinkingTabProps {
  thinking: Thinking;
  messageId: string;
  openThinkingId: string | null;
  setOpenThinkingId: (id: string | null) => void;
}

const ThinkingTab: React.FC<ThinkingTabProps> = ({
  thinking,
  messageId,
  openThinkingId,
  setOpenThinkingId,
}) => {
  const isOpen = openThinkingId === messageId;

  const toggleOpen = () => {
    setOpenThinkingId(isOpen ? null : messageId);
  };

  return (
    <div className="thinking-tab-container">
      <button onClick={toggleOpen} className="thinking-tab-header">
        <span>Thinking Process</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="thinking-tab-content">
          {thinking.thought && (
            <div className="thinking-section">
              <h3>Thought</h3>
              <p>{thinking.thought}</p>
            </div>
          )}
          {thinking.plan && (
            <div className="thinking-section">
              <h3>Plan</h3>
              <p>{thinking.plan}</p>
            </div>
          )}
          {thinking.steps && thinking.steps.length > 0 && (
            <div className="thinking-section">
              <h3>Steps</h3>
              <ul>
                {thinking.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThinkingTab;
