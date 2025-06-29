'use client';

import React, { useState, useEffect } from 'react';
import { checkBackendStatus } from '@/utils/api';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkBackendStatus();
      setIsConnected(status);
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isConnected ? 'green' : 'red',
        marginRight: '8px',
      }}></div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};

export default ConnectionStatus;
