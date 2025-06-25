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
    <div className="flex flex-col h-screen">
      <header className="header">
        <h1>AI Chat App</h1>
      </header>
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
      </div>
    </div>
  );
}
