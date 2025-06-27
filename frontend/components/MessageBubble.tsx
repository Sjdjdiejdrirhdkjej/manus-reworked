import React from 'react';
import type { Message } from '@/app/types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div
      className={`message-bubble ${message.isUser ? 'user-message' : 'ai-message'}`}
      dangerouslySetInnerHTML={{ __html: message.text }}
    />
  );
};

export default MessageBubble;
