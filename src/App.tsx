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

interface TerminalCommand {
  command: string;
  output: string;
  timestamp: number;
}

interface FileEdit {
  type: 'diff' | 'new';
  filename: string;
  content: string;
  language: string;
  timestamp: number;
}

interface BrowserView {
  url: string;
  streamUrl: string;
  timestamp: number;
}

interface InitStep {
  message: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [desktopMode] = useState<DesktopMode>(null);
  const [initStatus, setInitStatus] = useState<InitStatus>('ready');
  const [sandboxKey, setSandboxKey] = useState<string | null>(
    localStorage.getItem('CODESANDBOX_API_KEY')
  );
  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [fileEdits, setFileEdits] = useState<FileEdit[]>([]);
  const [browserViews, setBrowserViews] = useState<BrowserView[]>([]);
  const [initSteps, setInitSteps] = useState<InitStep[]>([
    { message: 'Starting system initialization...', status: 'pending' },
    { message: 'Checking CodeSandbox API key...', status: 'pending' },
    { message: 'Connecting to CodeSandbox...', status: 'pending' },
    { message: 'Setting up virtual environment...', status: 'pending' },
    { message: 'Preparing development workspace...', status: 'pending' }
  ]);

  useEffect(() => {
    const initializeSystem = async () => {
      if (mode === 'chat') {
        setInitStatus('ready');
        return;
      }

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

      // Check for CodeSandbox API key
      if (!sandboxKey) {
        setInitSteps(steps => steps.map((step, index) => 
          index === 1 ? { ...step, status: 'error' } : step
        ));
        setInitStatus('error');
        return;
      }

      // Try to connect to CodeSandbox
      try {
        // TODO: Validate the API key with CodeSandbox
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
  }, [mode]);

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
    <div style={{ display: 'flex', height: '100vh' }}>
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
              onChange={(e) => {
                const newMode = e.target.value as ChatMode;
                setMode(newMode);
                if (newMode === 'chat') {
                  // Immediately set ready status for chat mode
                  setInitStatus('ready');
                  // Reset init steps
                  setInitSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));
                } else {
                  // Start initialization for other modes
                  setInitStatus('pending');
                }
              }}
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
      {mode !== 'chat' && (
        <div className="manus-panel">
          <h2>Manus Desktop</h2>
          <div className="desktop-modes">
            <button 
              className={`desktop-mode-button ${desktopMode === 'terminal' ? 'active' : ''}`}
              disabled
            >
              <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 17l6-6-6-6M12 19h8" />
              </svg>
              Terminal
            </button>
            <button 
              className={`desktop-mode-button ${desktopMode === 'browser' ? 'active' : ''}`}
              disabled
            >
              <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M12 3v18M4 4l16 16M4 20L20 4" />
              </svg>
              Browser
            </button>
            <button 
              className={`desktop-mode-button ${desktopMode === 'editor' ? 'active' : ''}`}
              disabled
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
                     initStatus === 'error' && !sandboxKey ? 'CodeSandbox API Key Required' :
                     initStatus === 'error' ? 'Connection Error' : 'Ready'}
                  </span>
                  {initStatus === 'error' && !sandboxKey && (
                    <div className="api-key-form">
                      <input
                        type="password"
                        placeholder="Enter CodeSandbox API Key"
                        className="api-key-input"
                        value={sandboxKey || ''}
                        onChange={(e) => {
                          const key = e.target.value;
                          setSandboxKey(key);
                          if (key) {
                            localStorage.setItem('CODESANDBOX_API_KEY', key);
                            window.location.reload();
                          }
                        }}
                      />
                    </div>
                  )}
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
              <p>Desktop ready for agent use</p>
            ) : desktopMode === 'terminal' ? (
              <div className="terminal-view">
                {terminalHistory.length === 0 ? (
                  <div className="terminal-empty">No commands executed yet</div>
                ) : (
                  <div className="terminal-history">
                    {terminalHistory.map((cmd, index) => (
                      <div key={index} className="terminal-entry">
                        <div className="terminal-command">
                          <span className="prompt">$</span> {cmd.command}
                        </div>
                        <pre className="terminal-output">{cmd.output}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : desktopMode === 'browser' ? (
              <div className="browser-view">
                {browserViews.length === 0 ? (
                  <div className="browser-empty">No active browser sessions</div>
                ) : (
                  <div className="browser-stream">
                    <div className="browser-header">
                      <span className="browser-url">{browserViews[browserViews.length - 1].url}</span>
                    </div>
                    <div className="stream-container">
                      <img 
                        src={browserViews[browserViews.length - 1].streamUrl} 
                        alt="Browser View"
                        className="stream-content"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="editor-view">
                {fileEdits.length === 0 ? (
                  <div className="editor-empty">No files modified yet</div>
                ) : (
                  <div className="file-history">
                    {fileEdits.map((edit, index) => (
                      <div key={index} className="file-entry">
                        <div className="file-header">
                          <span className="file-name">{edit.filename}</span>
                          <span className="file-type">{edit.type === 'diff' ? 'Modified' : 'New File'}</span>
                        </div>
                        <pre className={`file-content language-${edit.language}`}>
                          {edit.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;