'use client';

import React, { forwardRef } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: (message: string) => void;
  isLoading: boolean;
  isSidebarOpen: boolean;
  handleClearChat: () => void;
  inputId: string;
}



const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  (
    { input, setInput, handleSend, isLoading, isSidebarOpen, handleClearChat, inputId },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
        setInput('');
        if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
          ref.current.focus();
        }
      }
    };

    return (
      <div className="input-area">
        <div className="input-container">
          <label htmlFor={inputId} className="sr-only">
            Type your message
          </label>
          <input
            id={inputId}
            ref={ref}
            type="text"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button onClick={() => {
            handleSend(input);
            setInput('');
            if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
              ref.current.focus();
            }
          }} className="send-button flex items-center justify-center" disabled={isLoading}>
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <div className="bottom-actions-container">
          {!isSidebarOpen ? <div /> : <div />} {/* Empty div to maintain space-between layout */}
          <div className="mode-option-container group">
            <button onClick={handleClearChat} disabled={isLoading} className="clear-chat-button" aria-label="Clear Chat">
              <ClearIcon />
            </button>
            <span className="mode-tooltip">Clear Chat</span>
          </div>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
