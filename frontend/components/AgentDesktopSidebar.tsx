import React from 'react';
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
      <button onClick={toggleSidebar} className="toggle-sidebar-button-closed">
        <Icons.ChevronLeft className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="agent-desktop-sidebar">
      <div className="sidebar-header">
        <h2>Agent Desktop</h2>
        <button onClick={toggleSidebar} className="toggle-sidebar-button-open">
          <Icons.ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <div className="view-selector">
        <button
          onClick={() => handleViewChange('terminal')}
          className={currentView === 'terminal' ? 'active' : ''}
        >
          Terminal
        </button>
        <button
          onClick={() => handleViewChange('browser')}
          className={currentView === 'browser' ? 'active' : ''}
        >
          Browser
        </button>
        <button
          onClick={() => handleViewChange('files')}
          className={currentView === 'files' ? 'active' : ''}
        >
          Files
        </button>
      </div>

      <div className="sidebar-content">
        {currentView === 'terminal' && (
          <div className="terminal-view">
            {terminal.output.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
        {currentView === 'browser' && (
          <div className="browser-view">
            <p>URL: {browser.url}</p>
            {browser.screenshot && (
              <img src={browser.screenshot} alt="Browser Screenshot" className="browser-screenshot" />
            )}
          </div>
        )}
        {currentView === 'files' && (
          <div className="files-view">
            {files.currentFile ? (
              <div>
                <h3>{files.currentFile.name}</h3>
                <pre>{files.currentFile.content}</pre>
              </div>
            ) : (
              <p>No file selected.</p>
            )}
            {files.fileTree && files.fileTree.length > 0 && (
              <div>
                <h3>File Tree</h3>
                <ul>
                  {files.fileTree.map((file: FileNode, index: number) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="activity-log">
        <h3>Activity Log</h3>
        <ul>
          {activities.map((activity) => (
            <li key={activity.id}>
              <strong>{activity.timestamp} - {activity.type}:</strong> {activity.action}
              {activity.args && (
                <pre className="activity-args">{JSON.stringify(activity.args, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AgentDesktopSidebar;
