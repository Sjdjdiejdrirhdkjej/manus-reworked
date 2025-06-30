import React from 'react';


interface ConnectionStatusProps {
  isConnected: boolean;
  label: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  label,
}) => {
  return (
    <div className="flex items-center text-sm">
      <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-gray-600 dark:text-gray-400">
        {label}: {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

export default ConnectionStatus;