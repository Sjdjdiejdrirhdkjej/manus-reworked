'use client';

import React, { useState, useRef, useId, useEffect } from 'react';

import type { Message, Mode } from '@/app/types';
import ChatMessageList from '@/components/ChatMessageList';
import ChatInput from '@/components/ChatInput';
import ModeSelector from '@/components/ModeSelector';
import SettingsModal from '@/components/SettingsModal';
import './chat.css';
import { useAgentDesktop } from '@/hooks/useAgentDesktop';
import AgentDesktopSidebar from '@/components/AgentDesktopSidebar';
import { sendMessageToApi, executeCommand, writeToFile, readFile, listFiles, createDirectory, moveItem, deleteItem, checkMcpServerStatus } from '@/utils/api';
import ConnectionStatus from '@/components/ConnectionStatus';
import WelcomeScreen from '@/components/WelcomeScreen';
import useLocalStorage from '@/hooks/useLocalStorage';


export default function Home() {
  const [messages, setMessages] = useLocalStorage<Message[]>('chat-history', []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode>('chat');
  const [openThinkingId, setOpenThinkingId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mistralApiKey, setMistralApiKey] = useLocalStorage<string>('mistral-api-key', '');
  const [mcpUrl, setMcpUrl] = useLocalStorage<string>('mcp-url', process.env.NEXT_PUBLIC_MCP_SERVER_URL || '');
  const [mcpConnectionStatus, setMcpConnectionStatus] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (mcpUrl) {
        const isConnected = await checkMcpServerStatus(mcpUrl);
        setMcpConnectionStatus(isConnected);
      } else {
        setMcpConnectionStatus(false);
      }
    };
    checkStatus();
  }, [mcpUrl]);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const [desktopState, dispatch] = useAgentDesktop(mcpUrl);

  const desktopEnabled = !!mcpUrl;

  const handleSend = async (message: string) => {
    const messageToSend = message;
    if (messageToSend.trim() === '') return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: message,
      isUser: true,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setIsLoading(true);

    try {
      const data = await sendMessageToApi(message, selectedMode, mistralApiKey);
      console.log('Data received in page.tsx:', data);

      if (data.desktop_actions && Array.isArray(data.desktop_actions)) {
        for (const action of data.desktop_actions) {
          let result: any;
          if (desktopEnabled) {
            switch (action.type) {
              case 'execute_command':
                result = await executeCommand(mcpUrl, action.args.command);
                break;
              case 'write_file_to_mcp':
                result = await writeToFile(mcpUrl, action.args.path, action.args.content);
                break;
              case 'read_file_from_mcp':
                result = await readFile(mcpUrl, action.args.path);
                break;
              case 'list_directory_mcp':
                result = await listFiles(mcpUrl, action.args.path);
                break;
              case 'create_directory_mcp':
                result = await createDirectory(mcpUrl, action.args.path);
                break;
              case 'move_item_mcp':
                result = await moveItem(mcpUrl, action.args.path, action.args.new_path);
                break;
              case 'delete_item_mcp':
                result = await deleteItem(mcpUrl, action.args.path, action.args.is_dir);
                break;
              default:
                result = { error: `Unknown desktop action type: ${action.type}` };
            }
          } else {
            result = { error: `Desktop features are not enabled. Please provide an MCP Server URL in settings.` };
          }
          dispatch({ type: 'API_ACTION', payload: { ...action, result: result.result || result.error, content: result.content } });
        }
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: data.response,
        isUser: false,
        thinking: data.thinking,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: error instanceof Error ? error.message : 'Sorry, an unknown error occurred.',
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
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

  const handleSaveSettings = (key: string, url: string) => {
    setMistralApiKey(key);
    setMcpUrl(url);
  };

  const handleSetSelectedMode = (mode: Mode) => {
    if (desktopEnabled || mode === 'chat') {
      setSelectedMode(mode);
    } else {
      setSelectedMode('chat');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="header flex justify-between items-center">
        <h1>Manus</h1>
        <div className="flex items-center space-x-4">
          <ConnectionStatus isConnected={mcpConnectionStatus} label="MCP Server" />
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors duration-200"
          >
            Settings
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 h-full">
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
          <ModeSelector 
            selectedMode={selectedMode} 
            setSelectedMode={handleSetSelectedMode}
            desktopEnabled={desktopEnabled}
          />
          <ChatInput
            ref={inputRef}
            inputId={inputId}
            input={input}
            setInput={setInput}
            handleSend={() => handleSend(input)}
            isLoading={isLoading}
            isSidebarOpen={desktopState.isSidebarOpen}
            handleClearChat={handleClearChat}
          />
        </div>
        <AgentDesktopSidebar desktopState={desktopState} dispatch={dispatch} />
      </div>
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
          initialMistralApiKey={mistralApiKey}
          initialMcpUrl={mcpUrl}
        />
      )}
    </div>
  );
}