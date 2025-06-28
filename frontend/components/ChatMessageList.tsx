import React, { useRef, useEffect, useState } from 'react';
import type { Message } from '@/app/types';
import ChatMessage from './ChatMessage';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  openThinkingId: string | null;
  setOpenThinkingId: (id: string | null) => void;
  // chatContainerRef: MutableRefObject<HTMLDivElement | null>; // This prop is no longer needed
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  openThinkingId,
  setOpenThinkingId,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Calculate the total number of items, including the potential typing indicator
  const itemCount = messages.length + (isLoading ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    // Estimate an average size for messages. This is crucial for initial rendering.
    // For varying message heights, consider a more sophisticated approach or `measureElement`.
    estimateSize: () => 50, // Example: 50 pixels per message
    overscan: 5, // Render a few extra items above/below the visible area to prevent flickering
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Effect to scroll to the bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (parentRef.current) {
      // Only auto-scroll if the user is already at the bottom or if it's the very first message
      const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom

      if (isAtBottom || messages.length === 1) {
        virtualizer.scrollToIndex(itemCount - 1, { align: 'end' });
      }
    }
  }, [messages.length, isLoading, itemCount, virtualizer]);

  // Effect to show/hide the "scroll to bottom" button
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = parent;
      // Show button if user has scrolled up more than 300px from the bottom
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
      setShowScrollToBottom(isScrolledUp);
    };

    parent.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      parent.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToBottom = () => {
    virtualizer.scrollToIndex(itemCount - 1, { align: 'end', behavior: 'smooth' });
  };

  return (
    <div
      ref={parentRef}
      className="chat-container"
      role="log"
      aria-live="polite"
      style={{ overflowY: 'auto', flex: 1, position: 'relative' }} // Ensure the container is scrollable and can position children
    >
      <div
        style={{
          height: virtualizer.getTotalSize(), // This sets the total scrollable height
          width: '100%',
          position: 'relative', // Required for absolute positioning of virtual items
        }}
      >
        {virtualItems.map((virtualItem) => {
          const index = virtualItem.index;
          const message = messages[index];

          // Handle the "AI is typing..." indicator as the last virtual item
          if (isLoading && index === messages.length) {
            return (
              <div
                key="typing-indicator" // Unique key for the typing indicator
                className="message-bubble ai-message"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="typing-indicator-container">
                  <div className="typing-dots">
                    <span className="dot dot-1">.</span>
                    <span className="dot dot-2">.</span>
                    <span className="dot dot-3">.</span>
                  </div>
                  <div className="typing-text">AI is typing...</div>
                </div>
              </div>
            );
          }

          // Ensure message exists (should always for valid indices)
          if (!message) return null;

          return (
            <div
              key={virtualItem.key} // Use virtualItem.key for the wrapper div
              data-index={virtualItem.index}
              ref={virtualizer.measureElement} // Allows TanStack Virtual to measure actual item height
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`, // Position the item
              }}
            >
              <ChatMessage
                message={message}
                openThinkingId={openThinkingId}
                setOpenThinkingId={setOpenThinkingId}
              />
            </div>
          );
        })}
      </div>
      {showScrollToBottom && (
        <button
          onClick={handleScrollToBottom}
          className="scroll-to-bottom-button"
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatMessageList;