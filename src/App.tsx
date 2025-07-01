import { useState } from 'react';
import { getChatResponse } from './services/mistral';
import './App.css';

declare global {
  interface Document {
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    webkitFullscreenElement?: Element;
    msExitFullscreen?: () => void;
    mozCancelFullScreen?: () => void;
    webkitExitFullscreen?: () => void;
  }

  interface HTMLElement {
    msRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
  }
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (input.trim()) {
      const userMessage: Message = { text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      // Get AI response from Mistral
      getChatResponse(input)
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
    <div className="chat-container" style={{ position: 'fixed', top: '0', right: '0', bottom: '0', left: '0' }}>
      <div className="message-list">
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
          onChange={(e) => setInput(e.target.value)
      }
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
  );
}

export default App;
