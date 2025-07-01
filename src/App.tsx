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
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as ChatMode)}
            style={{ padding: '5px', marginRight: '10px' }}
          >
            <option value="chat">Chat</option>
            <option value="cua">CUA</option>
            <option value="high-effort">High Effort</option>
          </select>
        </div>
        <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="message-list" style={{ flex: 1, overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} className={`message-bubble ${message.sender}-message`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="input-area">
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
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      </div>
      <div style={{ 
        width: '300px', 
        borderLeft: '1px solid #ccc',
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <h2>Manus Desktop</h2>
        <p>Coming soon...</p>
      </div>
    </div>
  );
}

export default App;