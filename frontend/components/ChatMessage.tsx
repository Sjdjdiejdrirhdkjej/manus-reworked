import React from 'react';
import type { Message } from '@/app/types';
import MessageBubble from './MessageBubble';
import ThinkingTab from './ThinkingTab';

interface ChatMessageProps {
  message: Message;
  openThinkingId: string | null;
  setOpenThinkingId: (id: string | null) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  openThinkingId,
  setOpenThinkingId,
}) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <MessageBubble message={message} />
      {message.thinking && (
        <ThinkingTab
          thinking={message.thinking}
          messageId={message.id}
          openThinkingId={openThinkingId}
          setOpenThinkingId={setOpenThinkingId}
        />
      )}
    </div>
  );
};

export default ChatMessage;
