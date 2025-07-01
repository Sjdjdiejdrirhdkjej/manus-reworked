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
  const [showSettings, setShowSettings] = useState(false);
  
  const [mistralKey, setMistralKey] = useState<string | null>(
    localStorage.getItem('MISTRAL_API_KEY') || import.meta.env.VITE_MISTRAL_API_KEY || null
  );
  const [sandboxKey, setSandboxKey] = useState<string | null>(
    localStorage.getItem('CODESANDBOX_API_KEY') || import.meta.env.VITE_CODESANDBOX_API_KEY || null
  );

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

  const isVercelApp = window.location.hostname.endsWith('.vercel.app');
  
  return (
    <div className="app-container">
      {!isVercelApp && (
        <div className="settings-tab" onClick={() => setShowSettings(prev => !prev)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-icon">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </div>
      )}
      {!isVercelApp && showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h2>Settings</h2>
            <button onClick={() => setShowSettings(false)} className="close-button">×</button>
          </div>
          <div className="settings-content">
            <div className="settings-group">
              <h3>API Keys</h3>
              <div className="settings-field">
                <label>Mistral AI API Key</label>
                <input
                  type="password"
                  value={mistralKey || ''}
                  onChange={(e) => {
                    const key = e.target.value;
                    setMistralKey(key);
                    if (key) localStorage.setItem('MISTRAL_API_KEY', key);
                    else localStorage.removeItem('MISTRAL_API_KEY');
                  }}
                  placeholder="Enter Mistral API key or add to .env"
                />
              </div>
              <div className="settings-field">
                <label>CodeSandbox API Key</label>
                <input
                  type="password"
                  value={sandboxKey || ''}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSandboxKey(key);
                    if (key) localStorage.setItem('CODESANDBOX_API_KEY', key);
                    else localStorage.removeItem('CODESANDBOX_API_KEY');
                  }}
                  placeholder="Enter CodeSandbox API key or add to .env"
                />
              </div>
            </div>
            <div className="settings-info">
              <p>Keys are stored in localStorage. Clear browser data to remove.</p>
              <p>Alternatively, add keys to your .env file:</p>
              <pre>
                VITE_MISTRAL_API_KEY=your_key_here
                VITE_CODESANDBOX_API_KEY=your_key_here
              </pre>
            </div>
          </div>
        </div>
      )}
      <div className="chat-section" style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
        <div className="desktop-view" style={{ flex: 1, borderLeft: '1px solid #ccc', padding: '10px' }}>
          <h2>Desktop View</h2>
          <p>This is the desktop panel.</p>
        </div>
      </div>
    </div>
  );
}

export default App;