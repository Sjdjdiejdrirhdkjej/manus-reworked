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
  const [selectedMode, setSelectedMode] = useState<'chat' | 'cua' | 'high-effort' | 'daytona'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [computerMode, setComputerMode] = useState<'terminal' | 'browser' | 'files'>('terminal');
  const [terminalHistory, setTerminalHistory] = useState<string[]>(['Welcome to Manus\'s Computer Terminal']);
  const [terminalInput, setTerminalInput] = useState('');
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [diffMode, setDiffMode] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [agentActivity, setAgentActivity] = useState<Array<{type: string, action: string, timestamp: Date}>>([]);
  const chatContainerRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDesktopAction = (action: any) => {
    const { type, args } = action;
    
    // Track agent activity
    const activity = {
      type,
      action: type === 'write_to_file' ? `Writing to ${args.file_name}` :
              type === 'read_file' ? `Reading ${args.file_name}` :
              type === 'go_to' ? `Navigating to ${args.url}` :
              type === 'execute_command' ? `Executing: ${args.command}` :
              type === 'search_google' ? `Searching: ${args.query}` :
              `${type}: ${JSON.stringify(args)}`,
      timestamp: new Date()
    };
    
    setAgentActivity(prev => [...prev, activity]);
    
    switch (type) {
      case 'write_to_file':
      case 'read_file':
        setComputerMode('files');
        setIsSidebarOpen(true);
        if (type === 'write_to_file') {
          setFileName(args.file_name);
          setFileContent(args.content);
        } else if (type === 'read_file') {
          setFileName(args.file_name);
          // In a real implementation, you would fetch the file content
          setFileContent(`// Content of ${args.file_name}\n// Lines ${args.line_start || 'all'} to ${args.line_end || 'all'}`);
        }
        break;
      case 'go_to':
        setComputerMode('browser');
        setIsSidebarOpen(true);
        setBrowserUrl(args.url);
        break;
      case 'execute_command':
      case 'write_to_terminal':
      case 'run_in_background':
        if (type !== 'run_in_background') {
          setComputerMode('terminal');
          setIsSidebarOpen(true);
        }
        const newHistory = [...terminalHistory, `$ ${args.command || args.text}`];
        setTerminalHistory(newHistory);
        break;
      case 'search_google':
        setComputerMode('browser');
        setIsSidebarOpen(true);
        setBrowserUrl(`https://www.google.com/search?q=${encodeURIComponent(args.query)}`);
        break;
      default:
        console.log('Desktop action:', type, args);
    }
  };

  const handleTerminalCommand = (command: string) => {
    const newHistory = [...terminalHistory, `$ ${command}`];
    
    // Simple command simulation
    switch (command.toLowerCase()) {
      case 'ls':
        newHistory.push('main.py  requirements.txt  README.md');
        break;
      case 'pwd':
        newHistory.push('/home/runner/workspace');
        break;
      case 'whoami':
        newHistory.push('manus');
        break;
      case 'date':
        newHistory.push(new Date().toString());
        break;
      case 'clear':
        setTerminalHistory(['Welcome to Manus\'s Computer Terminal']);
        setTerminalInput('');
        return;
      default:
        if (command.startsWith('cat ')) {
          const filename = command.substring(4);
          newHistory.push(`Content of ${filename}:`);
          newHistory.push('# This is a simulated file content');
          newHistory.push('print("Hello from simulated file")');
        } else if (command.startsWith('echo ')) {
          newHistory.push(command.substring(5));
        } else {
          newHistory.push(`bash: ${command}: command not found`);
        }
    }
    
    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

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
        body: JSON.stringify({ message: currentInput, mode: selectedMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Handle desktop actions for Daytona mode
      if (data.desktop_action && selectedMode === 'daytona') {
        handleDesktopAction(data.desktop_action);
      }

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
        <h1>Manus</h1>
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
          <div 
            className={`mode-option ${selectedMode === 'daytona' ? 'active' : ''}`}
            onClick={() => setSelectedMode('daytona')}
            title="Daytona Mode"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="mode-icon">
              <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h6l-2 2v1h8v-1l-2-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
            </svg>
          </div>
        </div>
        </div>
        </div>
        {isSidebarOpen && (
          <div className="sidebar-right">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Agent Activity</h2>
              <button 
                className="toggle-button"
                onClick={() => setIsSidebarOpen(false)}
                title="Close activity tracker"
              >
                ×
              </button>
            </div>
            
            <div className="activity-tracker">
              <div className="activity-scroll">
                {agentActivity.length === 0 ? (
                  <div className="activity-empty">No agent activity yet</div>
                ) : (
                  agentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-type">{activity.type}</div>
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-timestamp">
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="current-view">
              <div className="view-header">Current View: {computerMode}</div>
              <div className="view-content">
                {computerMode === 'terminal' && (
                  <div className="terminal-container">
                    <div className="terminal-output">
                      {terminalHistory.map((line, index) => (
                        <div key={index} className="terminal-line">
                          {line}
                        </div>
                      ))}
                    </div>
                    <div className="terminal-input-container">
                      <span className="terminal-prompt">$ </span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleTerminalCommand(terminalInput);
                          }
                        }}
                        className="terminal-input"
                        placeholder="Enter command..."
                      />
                    </div>
                  </div>
                )}
                
                {computerMode === 'browser' && (
                  <div className="browser-container">
                    <div className="browser-address-bar">
                      <input
                        type="url"
                        value={browserUrl}
                        onChange={(e) => setBrowserUrl(e.target.value)}
                        className="browser-url-input"
                        placeholder="Enter URL..."
                      />
                    </div>
                    <div className="browser-content">
                      <iframe
                        src={browserUrl}
                        title="Browser"
                        className="browser-frame"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
                
                {computerMode === 'files' && (
                  <div className="files-container">
                    <div className="file-header">
                      <div className="file-name-display">{fileName || 'No file selected'}</div>
                      <button 
                        className="diff-toggle"
                        onClick={() => setDiffMode(!diffMode)}
                      >
                        {diffMode ? 'View Mode' : 'Diff Mode'}
                      </button>
                    </div>
                    
                    {diffMode ? (
                      <div className="diff-view">
                        <div className="diff-section">
                          <h4>Original</h4>
                          <textarea
                            value={originalContent}
                            onChange={(e) => setOriginalContent(e.target.value)}
                            className="diff-textarea original"
                            placeholder="Original content..."
                          />
                        </div>
                        <div className="diff-section">
                          <h4>Modified</h4>
                          <textarea
                            value={fileContent}
                            onChange={(e) => setFileContent(e.target.value)}
                            className="diff-textarea modified"
                            placeholder="Modified content..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="file-preview">
                        <textarea
                          value={fileContent}
                          onChange={(e) => setFileContent(e.target.value)}
                          className="file-content-textarea"
                          placeholder="File content will appear here..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
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