import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mistralApiKey: string, mcpUrl: string) => void;
  initialMistralApiKey: string;
  initialMcpUrl: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMistralApiKey,
  initialMcpUrl,
}) => {
  const [mistralApiKey, setMistralApiKey] = useState(initialMistralApiKey);
  const [mcpUrl, setMcpUrl] = useState(initialMcpUrl);

  useEffect(() => {
    setMistralApiKey(initialMistralApiKey);
    setMcpUrl(initialMcpUrl);
  }, [initialMistralApiKey, initialMcpUrl]);

  const handleSave = () => {
    onSave(mistralApiKey, mcpUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-foreground">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>

        <div className="mb-4">
          <label htmlFor="mistralApiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Mistral API Key
          </label>
          <input
            type="password"
            id="mistralApiKey"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            value={mistralApiKey}
            onChange={(e) => setMistralApiKey(e.target.value)}
            placeholder="Enter your Mistral API Key"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="mcpUrl" className="block text-sm font-medium text-gray-700 mb-1">
            MCP Server URL (for Desktop features)
          </label>
          <input
            type="text"
            id="mcpUrl"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            value={mcpUrl}
            onChange={(e) => setMcpUrl(e.target.value)}
            placeholder="e.g., http://localhost:8000"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
