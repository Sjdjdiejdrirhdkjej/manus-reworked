import React from 'react';

interface McpSetupPopupProps {
  onClose: () => void;
}

const McpSetupPopup: React.FC<McpSetupPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Implement MCP Server</h2>
        <p className="text-gray-700 mb-6">
          To enable advanced desktop features like terminal usage and file storage, you need to implement an MCP (Master Control Program) server.
          Without it, the application will be limited to chat mode.
        </p>
        <button
          onClick={onClose}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-hover transition-colors duration-200"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default McpSetupPopup;
