'use client';

import React, { useState, useRef, useId } from 'react';
import type { MutableRefObject } from 'react';
import type { Message, Mode } from '@/app/types';
import ChatMessageList from '@/components/ChatMessageList';
import ChatInput from '@/components/ChatInput';
import './chat.css';
import { useAgentDesktop } from '@/hooks/useAgentDesktop';
import AgentDesktopSidebar from '@/components/AgentDesktopSidebar';
import { sendMessageToApi } from '@/utils/api';
import WelcomeScreen from '@/components/WelcomeScreen';
import useLocalStorage from '@/hooks/useLocalStorage';


export default function Home() {
  const [messages, setMessages] = useLocalStorage<Message[]>('chat-history', []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode>('chat');
  const [openThinkingId, setOpenThinkingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const [desktopState, dispatch] = useAgentDesktop();
  // chatContainerRef and its useEffect are no longer needed as ChatMessageList manages its own scrolling
  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (messageToSend.trim() === '') return;

    // 1. Optimistically update UI with the user's message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: messageToSend,
      isUser: true,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (!messageOverride) {
      setInput('');
      // Re-focus the input field for a smoother conversational flow
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    setIsLoading(true);

    try {
      // 2. Perform the API call
      const data = await sendMessageToApi(messageToSend, selectedMode);

      // 3. Handle side-effects from the response
      if (data.desktop_actions && Array.isArray(data.desktop_actions)) {
        data.desktop_actions.forEach((action: any) => dispatch({ type: 'API_ACTION', payload: action }));
      }

      // 4. Update UI with the successful AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: data.response,
        isUser: false,
        thinking: data.thinking,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      // 5. Update UI with a descriptive error message
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: error instanceof Error ? error.message : 'Sorry, an unknown error occurred.',
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      // 6. Ensure loading state is always reset
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt);
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#0D1B2A' }}>
      <header className="header">
        <h1>Manus</h1>
      </header>
      <div className="flex flex-1">
        <div className="flex flex-col flex-1">
          {messages.length > 0 ? (
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              openThinkingId={openThinkingId}
              setOpenThinkingId={setOpenThinkingId}
            />
          ) : (
            <WelcomeScreen onExampleClick={handleExamplePrompt} />
          )}
          <ChatInput
            ref={inputRef}
            inputId={inputId}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            isLoading={isLoading}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            isSidebarOpen={desktopState.isSidebarOpen}
            handleClearChat={handleClearChat}
          />
        </div> {/* End of flex-col flex-1 */}
        <AgentDesktopSidebar desktopState={desktopState} dispatch={dispatch} />
      </div>
    </div>
  );
}