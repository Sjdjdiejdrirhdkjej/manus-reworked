'use client';

import React, { useState, useRef, useEffect, MutableRefObject } from 'react';
import './chat.css';

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  loading?: boolean;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I assist you today?', isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'chat' | 'cua' | 'high-effort'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatContainerRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      isUser: true,
    };

    setMessages([...messages, newMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiResponse: Message = {
        id: messages.length + 2,
        text: data.response,
        isUser: false,
      };

      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorResponse: Message = {
        id: messages.length + 2,
        text: 'Sorry, there was an error processing your request.',
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#0D1B2A' }}>
      <header className="header">
        <h1>AI Chat App</h1>
      </header>
      <div className="flex flex-1">
        <div className="flex flex-col flex-1">
      <div
        ref={chatContainerRef}
        className="chat-container"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-bubble ${message.isUser ? 'user-message' : 'ai-message'}`}
          >
            {message.text}
            {message.loading && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message-bubble ai-message">
            <div className="text-sm text-gray-500">
              <span className="animate-pulse">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="input-area">
        {!isSidebarOpen && (
          <div className="computer-preview">
            <div className="computer-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="computer-svg">
                <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h6l-2 2v1h8v-1l-2-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
              </svg>
              <span className="computer-text">Manus's Computer</span>
            </div>
          </div>
        )}
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="input-field"
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            className="send-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="mode-selector">
          <div 
            className={`mode-option ${selectedMode === 'chat' ? 'active' : ''}`}
            onClick={() => setSelectedMode('chat')}
            title="Chat Mode"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="mode-icon">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
            </svg>
          </div>
          <div 
            className={`mode-option ${selectedMode === 'cua' ? 'active' : ''}`}
            onClick={() => setSelectedMode('cua')}
            title="CUA Mode"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="mode-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div 
            className={`mode-option ${selectedMode === 'high-effort' ? 'active' : ''}`}
            onClick={() => setSelectedMode('high-effort')}
            title="High Effort Mode"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="mode-icon">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
        </div>
        </div>
        {isSidebarOpen && (
          <div className="sidebar-right">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Manus's Computer</h2>
              <button 
                className="toggle-button"
                onClick={() => setIsSidebarOpen(false)}
                title="Close computer"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {!isSidebarOpen && (
          <button 
            className="reopen-button"
            onClick={() => setIsSidebarOpen(true)}
            title="Open computer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="reopen-icon">
              <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h6l-2 2v1h8v-1l-2-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}