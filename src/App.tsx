import { useState } from 'react';
import { getChatResponse } from './services/mistral';
import type { ChatMode } from './services/mistral';
import './App.css';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

// Start prefetching as soon as possible
function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');


  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      // Show typing indicator
      setMessages((prevMessages) => [...prevMessages, { text: 'typingIndicator', sender: 'ai' }]);
      
      // Get AI response from Mistral
      getChatResponse(input, mode)
        .then(response => {
          setMessages((prevMessages) => [...prevMessages.slice(0, -1), { text: response, sender: 'ai' }]);
        })
        .catch(error => {
          const errorResponse: Message = { text: `Error: ${error.message}`, sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, errorResponse]);
        });
    }
  };

  return (
    <div className="app-container">
      <div className="chat-section" style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <div style={{ flex: mode === 'chat' ? 1 : 0.6, height: '100%' }}>
          <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="message-list" style={{ flex: 1, overflowY: 'auto' }}>
              {messages.length === 0 && (
                <div className="suggestions">
                  <h3>Try these examples:</h3>
                  <div className="suggestion-list">
                    <button onClick={() => setInput("Create a new React component for a todo list")}>
                      "Create a new React component for a todo list"
                    </button>
                    <button onClick={() => setInput("Help me debug this error: TypeError: Cannot read property 'map' of undefined")}>
                      "Help me debug this error: TypeError: Cannot read property 'map' of undefined"
                    </button>
                    <button onClick={() => setInput("Optimize this code for better performance: for(let i=0; i<arr.length; i++) { result.push(arr[i] * 2) }")}>
                      "Optimize this code for better performance..."
                    </button>
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`message-bubble ${message.sender}-message`}>
                  {message.text === 'typingIndicator' ? (
                    <div className="typing-indicator">
                      Manus is typing<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                    </div>
                  ) : message.text}
                </div>
              ))}
            </div>
            <div className="input-area">
              <select 
                value={mode}
                onChange={(e) => setMode(e.target.value as ChatMode)}
                className="mode-select"
              >
                <option value="chat">Chat</option>
                <option value="cua">CUA</option>
                <option value="high-effort">High Effort</option>
              </select>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
              />
              <button className="send-button" onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
        {(mode === 'cua' || mode === 'high-effort') && (
          <div className="desktop-view" style={{ flex: 0.4, borderLeft: '1px solid #ccc', padding: '20px', height: '100%', overflowY: 'auto' }}>
            <h2>Desktop View</h2>
            <p>Selected Mode: {mode}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;