import React from 'react';
import Image from 'next/image';
import type { AgentDesktopState, AgentDesktopAction, FileNode } from '@/hooks/useAgentDesktop';
import { Icons } from './Icons';

interface AgentDesktopSidebarProps {
  desktopState: AgentDesktopState;
  dispatch: React.Dispatch<AgentDesktopAction>;
}

const AgentDesktopSidebar: React.FC<AgentDesktopSidebarProps> = ({
  desktopState,
  dispatch,
}) => {
  const { isSidebarOpen, currentView, terminal, browser, files, activities } = desktopState;

  const handleViewChange = (view: AgentDesktopState['currentView']) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-l-lg shadow-lg z-50"
      >
        <Icons.ChevronLeft className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="w-80 bg-gray-100 border-l border-gray-200 p-4 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-foreground">Agent Desktop</h2>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Icons.ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => handleViewChange('terminal')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${currentView === 'terminal' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Terminal
        </button>
        <button
          onClick={() => handleViewChange('browser')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${currentView === 'browser' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Browser
        </button>
        <button
          onClick={() => handleViewChange('files')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${currentView === 'files' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Files
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentView === 'terminal' && (
          <div className="bg-gray-800 text-green-400 p-3 rounded-md font-mono text-sm h-full overflow-auto">
            {terminal.output.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
        {currentView === 'browser' && (
          <div className="h-full flex flex-col">
            <p className="text-sm text-gray-600 mb-2">URL: <span className="font-mono text-blue-600">{browser.url}</span></p>
            {browser.screenshot && (
              <div className="flex-1 relative">
                <Image
                  src={browser.screenshot}
                  alt="Browser Screenshot"
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        )}
        {currentView === 'files' && (
          <div className="h-full flex flex-col">
            {files.currentFile ? (
              <div className="flex-1 bg-white p-3 rounded-md border border-gray-200 overflow-auto">
                <h3 className="font-semibold text-blue-700 mb-2">{files.currentFile.name}</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{files.currentFile.content}</pre>
              </div>
            ) : (
              <p className="text-gray-500 italic">No file selected.</p>
            )}
            {files.fileTree && files.fileTree.length > 0 && (
              <div className="mt-4 bg-white p-3 rounded-md border border-gray-200 overflow-auto max-h-48">
                <h3 className="font-semibold text-gray-700 mb-2">File Tree</h3>
                <ul>
                  {files.fileTree.map((file: FileNode, index: number) => (
                    <li key={index} className="text-sm text-gray-800">{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-foreground mb-3">Activity Log</h3>
        <ul className="max-h-48 overflow-y-auto bg-white p-3 rounded-md border border-gray-200">
          {activities.length === 0 && <li className="text-gray-500 italic">No activity yet.</li>}
          {activities.map((activity) => (
            <li key={activity.id} className="mb-3 p-2 bg-gray-50 rounded-md border-l-2 border-primary">
              <strong className="text-primary text-xs uppercase block mb-1">{activity.type}:</strong>
              <span className="text-sm text-gray-800 block">{activity.action}</span>
              {activity.args && (
                <pre className="bg-gray-200 p-1 rounded-sm text-xs text-gray-700 mt-1 overflow-x-auto">{JSON.stringify(activity.args, null, 2)}</pre>
              )}
              <span className="text-xs text-gray-500 block mt-1">{activity.timestamp}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentDesktopSidebar;