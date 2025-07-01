import { useState, useEffect } from 'react';
import { getChatResponse } from './services/mistral';
import type { ChatMode } from './services/mistral';
import './App.css';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

type DesktopMode = 'terminal' | 'browser' | 'editor' | null;
type InitStatus = 'pending' | 'connecting' | 'ready' | 'error';

interface InitStep {
  message: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [desktopMode, setDesktopMode] = useState<DesktopMode>(null);
  const [initStatus, setInitStatus] = useState<InitStatus>('pending');
  const [initSteps, setInitSteps] = useState<InitStep[]>([
    { message: 'Starting system initialization...', status: 'pending' },
    { message: 'Establishing secure connection...', status: 'pending' },
    { message: 'Connecting to CodeSandbox...', status: 'pending' },
    { message: 'Setting up virtual environment...', status: 'pending' },
    { message: 'Preparing development workspace...', status: 'pending' }
  ]);

  useEffect(() => {
    const initializeSystem = async () => {
      // Simulate system initialization
      setInitStatus('connecting');
      
      for (let i = 0; i < initSteps.length; i++) {
        setInitSteps(steps => steps.map((step, index) => 
          index === i 
            ? { ...step, status: 'loading' }
            : step
        ));

        // Simulate each step taking some time
        await new Promise(resolve => setTimeout(resolve, 1000));

        setInitSteps(steps => steps.map((step, index) => 
          index === i 
            ? { ...step, status: 'done' }
            : step
        ));
      }

      // TODO: Actually try to connect to CodeSandbox here
      try {
        // Simulate CodeSandbox connection
        await new Promise(resolve => setTimeout(resolve, 1500));
        setInitStatus('ready');
      } catch (error) {
        setInitStatus('error');
        setInitSteps(steps => steps.map((step, index) => 
          index === 2 ? { ...step, status: 'error' } : step
        ));
      }
    };

    initializeSystem();
  }, []);

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
      <div className="chat-section">
        <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="message-list" style={{ flex: 1, overflowY: 'auto' }}>
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
      <div className="manus-panel">
        <h2>Manus Desktop</h2>
        <div className="desktop-modes">
          <button 
            className={`desktop-mode-button ${desktopMode === 'terminal' ? 'active' : ''}`}
            onClick={() => setDesktopMode(desktopMode === 'terminal' ? null : 'terminal')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17l6-6-6-6M12 19h8" />
            </svg>
            Terminal
          </button>
          <button 
            className={`desktop-mode-button ${desktopMode === 'browser' ? 'active' : ''}`}
            onClick={() => setDesktopMode(desktopMode === 'browser' ? null : 'browser')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M12 3v18M4 4l16 16M4 20L20 4" />
            </svg>
            Browser
          </button>
          <button 
            className={`desktop-mode-button ${desktopMode === 'editor' ? 'active' : ''}`}
            onClick={() => setDesktopMode(desktopMode === 'editor' ? null : 'editor')}
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Editor
          </button>
        </div>
        <div className="desktop-content">
          {initStatus !== 'ready' ? (
            <div className="init-sequence">
              <div className="init-header">
                <span className={`init-status ${initStatus}`}>
                  {initStatus === 'pending' ? 'Waiting to start...' :
                   initStatus === 'connecting' ? 'Initializing...' :
                   initStatus === 'error' ? 'Connection Error' : 'Ready'}
                </span>
              </div>
              <div className="init-steps">
                {initSteps.map((step, index) => (
                  <div key={index} className={`init-step ${step.status}`}>
                    <span className="step-indicator">
                      {step.status === 'pending' ? '○' :
                       step.status === 'loading' ? '●' :
                       step.status === 'done' ? '✓' : '×'}
                    </span>
                    <span className="step-message">{step.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : desktopMode === null ? (
            <p>Select a mode to begin...</p>
          ) : desktopMode === 'terminal' ? (
            <div className="terminal-view">Terminal view coming soon...</div>
          ) : desktopMode === 'browser' ? (
            <div className="browser-view">Browser view coming soon...</div>
          ) : (
            <div className="editor-view">Editor view coming soon...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;