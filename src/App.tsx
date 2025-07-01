import { useState, useEffect } from 'react';
import { getChatResponse } from './services/mistral';
import type { ChatMode } from './services/mistral';
import { sandboxService } from './services/sandbox';
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
  waiting?: boolean; // For commands waiting for input
}

type DesktopCommand = 
  | { type: 'write_to_file'; filename: string; content: string; }
  | { type: 'read_file'; filename: string; start?: number; end?: number; }
  | { type: 'search_google'; query: string; }
  | { type: 'go_to'; url: string; }
  | { type: 'click'; index: number; }
  | { type: 'scroll_down'; pixels: number; }
  | { type: 'scroll_up'; pixels: number; }
  | { type: 'press_key'; key: 'ENTER'; }
  | { type: 'switch_tab'; index: number; }
  | { type: 'new_tab'; }
  | { type: 'execute_command'; command: string; }
  | { type: 'write_to_terminal'; text: string; }
  | { type: 'run_in_background'; command: string; }

const getFileLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'xml': 'xml',
    'txt': 'text'
  };
  return languageMap[ext] || 'text';
};

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
  const [desktopMode, setDesktopMode] = useState<DesktopMode>(null);
  const [initStatus, setInitStatus] = useState<InitStatus>('ready');
  const [sandboxKey, setSandboxKey] = useState<string | null>(
    localStorage.getItem('CODESANDBOX_API_KEY')
  );
  const [sandboxReady, setSandboxReady] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalCommand[]>([]);
  const [fileEdits, setFileEdits] = useState<FileEdit[]>([]);
  const [browserViews, setBrowserViews] = useState<BrowserView[]>([]);


  const handleDesktopCommand = async (command: DesktopCommand) => {
    if (mode === 'chat') return; // Desktop commands only work in CUA and high-effort modes

    const executeAPICommand = async <T,>(apiCall: () => Promise<T>) => {
      try {
        return await retryAPICall(apiCall);
      } catch (error) {
        console.error('API call failed after retries:', error);
        throw error;
      }
    };

    switch (command.type) {
      case 'write_to_file':
        setDesktopMode('editor');
        try {
          const content = await sandboxService.createFile(command.filename, command.content);
          setFileEdits(prev => [...prev, {
            type: 'new',
            filename: command.filename,
            content: content,
            language: getFileLanguage(command.filename),
            timestamp: Date.now()
          }]);

          // Display file contents immediately after creation
          const fileContent = await sandboxService.readFile(command.filename);
          setMessages(prev => [...prev, {
            text: `[File Created] ${command.filename}\n${fileContent}`,
            sender: 'ai'
          }]);
        } catch (error) {
          console.error('Failed to create file:', error);
          throw error;
        }
        break;

      case 'read_file':
        setDesktopMode('editor');
        try {
          const content = await sandboxService.readFile(command.filename);
          setFileEdits(prev => [...prev, {
            type: 'new',
            filename: command.filename,
            content: content,
            language: getFileLanguage(command.filename),
            timestamp: Date.now()
          }]);
          
          // Show the file contents in the chat
          setMessages(prev => [...prev, {
            text: `[File Contents] ${command.filename}\n${content}`,
            sender: 'ai'
          }]);
        } catch (error) {
          console.error('Failed to read file:', error);
          throw error;
        }
        break;

      case 'search_google':
        setDesktopMode('browser');
        await executeAPICommand(async () => {
          setBrowserViews(prev => [...prev, {
            url: `https://www.google.com/search?q=${encodeURIComponent(command.query)}`,
            streamUrl: 'STREAM_URL_HERE', // This would be set by the actual implementation
            timestamp: Date.now()
          }]);
        });
        break;

      case 'go_to':
        setDesktopMode('browser');
        await executeAPICommand(async () => {
          setBrowserViews(prev => [...prev, {
            url: command.url,
            streamUrl: 'STREAM_URL_HERE', // This would be set by the actual implementation
            timestamp: Date.now()
          }]);
        });
        break;

      case 'execute_command':
        setDesktopMode('terminal');
        try {
          const output = await sandboxService.executeCommand(command.command);
          setTerminalHistory(prev => [...prev, {
            command: command.command,
            output: output,
            timestamp: Date.now()
          }]);
        } catch (error) {
          console.error('Failed to execute command:', error);
          setTerminalHistory(prev => [...prev, {
            command: command.command,
            output: `Error: ${error.message}`,
            timestamp: Date.now()
          }]);
        }
        break;

      case 'write_to_terminal':
        setDesktopMode('terminal');
        setTerminalHistory(prev => {
          const last = prev[prev.length - 1];
          if (last?.waiting) {
            return [...prev.slice(0, -1), {
              ...last,
              output: last.output + '\n' + command.text,
              waiting: false
            }];
          }
          return prev;
        });
        break;

      case 'run_in_background':
        try {
          await sandboxService.runInBackground(command.command);
          setTerminalHistory(prev => [...prev, {
            command: `${command.command} &`,
            output: 'Command started in background',
            timestamp: Date.now()
          }]);
        } catch (error) {
          console.error('Failed to run background command:', error);
        }
        break;

      // Browser controls
      case 'click':
      case 'scroll_down':
      case 'scroll_up':
      case 'press_key':
      case 'switch_tab':
      case 'new_tab':
        setDesktopMode('browser');
        // These would update the browser state and trigger a new stream frame
        break;
    }
  };
  const [initSteps, setInitSteps] = useState<InitStep[]>([
    { message: 'Starting WebContainer...', status: 'pending' },
    { message: 'Checking API key...', status: 'pending' },
    { message: 'Setting up file system...', status: 'pending' },
    { message: 'Installing dependencies...', status: 'pending' },
    { message: 'Preparing workspace...', status: 'pending' }
  ]);

  useEffect(() => {
    const initializeSystem = async () => {
      if (mode === 'chat') {
        setInitStatus('ready');
        return;
      }

      setInitStatus('connecting');

      // Initialize sandbox if we have a key
      if (!sandboxKey) {
        setInitSteps(steps => steps.map((step, index) => 
          index === 1 ? { ...step, status: 'error' } : step
        ));
        setInitStatus('error');
        return;
      }

      // Try to initialize sandbox
      try {
        await sandboxService.initialize(sandboxKey, (step) => {
          setInitSteps(steps => steps.map((s, index) => ({
            ...s,
            status: index === step ? 'loading' :
                    index < step ? 'done' : 'pending'
          })));
        });
        
        // Mark all steps as done
        setInitSteps(steps => steps.map(step => ({ ...step, status: 'done' })));
        setSandboxReady(true);
        setInitStatus('ready');
      } catch (error: unknown) {
        console.error('Failed to initialize sandbox:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitSteps(steps => steps.map(step => ({
          ...step,
          status: step.status === 'loading' ? 'error' : step.status
        })));
        setInitStatus('error');
        return;
      }
      
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

  // Utility function to retry failed API calls
  const retryAPICall = async <T,>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 3000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries reached');
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      // Show typing indicator
      setMessages((prevMessages) => [...prevMessages, { text: 'typingIndicator', sender: 'ai' }]);
      
      // Get AI response from Mistral with retry logic
      retryAPICall(() => getChatResponse(input, mode))
        .then(response => {
          // Step 1: Show agent's reasoning
          setMessages((prevMessages) => [...prevMessages.slice(0, -1), { 
            text: `[Reasoning]\n${response}`, 
            sender: 'ai' 
          }]);

          // Step 2: Show action (example desktop command)
          if (mode !== 'chat') {
            setTimeout(() => {
              setMessages(prev => [...prev, {
                text: '[Action]\nwrite_to_file("example.txt", "This is a test")',
                sender: 'ai'
              }]);

              // Execute the action
              handleDesktopCommand({
                type: 'write_to_file',
                filename: 'example.txt',
                content: 'This is a test'
              });

              // Step 3: Show action review
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  text: '[Review]\nFile has been created successfully. Contents verified.',
                  sender: 'ai'
                }]);

                // Step 4: Next reasoning would start on next user message
              }, 1000);
            }, 1000);
          }
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
              <div 
                key={index} 
                className={`message-bubble ${message.sender}-message`}
                data-type={
                  message.text.startsWith('[Reasoning]') ? 'reasoning' :
                  message.text.startsWith('[Action]') ? 'action' :
                  message.text.startsWith('[Review]') ? 'review' : undefined
                }
              >
                {message.text === 'typingIndicator' ? (
                  <div className="typing-indicator">
                    Manus is typing<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                  </div>
                ) : (
                  <>
                    {message.text.startsWith('[') && message.text.includes(']') ? (
                      message.text.split('\n').slice(1).join('\n')
                    ) : (
                      message.text
                    )}
                  </>
                )}
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
                        <pre className={`file-content ${edit.type === 'diff' ? 'diff' : ''}`}>
                          <code className={`language-${edit.language}`}>
                            {edit.content}
                          </code>
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