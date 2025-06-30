import React from 'react';
import Image from 'next/image';

const ChatHeader: React.FC = () => {
  return (
    <div className="header">
      <Image src="/logo.jpeg" alt="Manus Logo" width={50} height={50} />
      <h1>Manus</h1>
    </div>
  );
};

export default ChatHeader;
