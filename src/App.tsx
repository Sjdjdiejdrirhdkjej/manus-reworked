import { useState } from 'react';
import { getChatResponse } from './services/mistral';
import type { ChatMode } from './services/mistral';
import './App.css';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      // Get AI response from Mistral
      getChatResponse(input, mode)
        .then(response => {
          const aiResponse: Message = { text: response, sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, aiResponse]);
        })
        .catch(error => {
          const errorResponse: Message = { text: `Error: ${error.message}`, sender: 'ai' };
          setMessages((prevMessages) => [...prevMessages, errorResponse]);
        });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="message-list" style={{ flex: 1, overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} className={`message-bubble ${message.sender}-message`}>
                {message.text}
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
      <div className="manus-panel" style={{ width: '300px' }}>
        <h2>Manus Desktop</h2>
        <p>Coming soon...</p>
      </div>
    </div>
  );
}

export default App;