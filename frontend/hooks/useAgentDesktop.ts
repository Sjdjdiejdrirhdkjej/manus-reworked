'use client';

import { useReducer, useEffect } from 'react';
import { listFiles, readFile, writeToFile, createDirectory, moveItem, deleteItem } from '../utils/api';

// State and Action Types
export type Activity = {
  id: string;
  type: string;
  action: string;
  timestamp: string;
  args?: any;
};

export type FileData = {
  name: string;
  content: string;
  originalContent?: string;
};

export type FileNode = {
  name: string;
  isDirectory: boolean;
};

export type AgentDesktopState = {
  isSidebarOpen: boolean;
  activities: Activity[];
  currentView: 'terminal' | 'files';
  terminal: {
    output: string[];
  };
  files: {
    currentFile: FileData | null;
    fileTree: FileNode[];
  };
};

export type AgentDesktopAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_VIEW'; payload: AgentDesktopState['currentView'] }
  | { type: 'API_ACTION'; payload: { type: string; result?: string; error?: string; content?: string; args?: any; files?: FileNode[]; } };

// Initial State
const initialState: AgentDesktopState = {
  isSidebarOpen: true,
  activities: [],
  currentView: 'terminal',
  terminal: {
    output: ['Welcome to the virtual terminal.'],
  },
  files: {
    currentFile: null,
    fileTree: [],
  },
};

// Reducer
function agentDesktopReducer(state: AgentDesktopState, action: AgentDesktopAction): AgentDesktopState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'API_ACTION': {
      const { payload } = action;
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        type: payload.type,
        action: payload.result || `Error: ${payload.error}`,
        timestamp: new Date().toLocaleTimeString(),
        args: payload.args,
      };

      const newState = { 
        ...state, 
        activities: [newActivity, ...state.activities] 
      };

      switch (payload.type) {
        case 'execute_command':
          return { ...newState, currentView: 'terminal', terminal: { ...newState.terminal, output: [...newState.terminal.output, `$ ${payload.args.command}`, payload.result || ''] } };
        case 'list_directory_mcp':
          return { ...newState, currentView: 'files', files: { ...newState.files, fileTree: payload.files ? payload.files.map((file: any) => ({ name: file.name, isDirectory: file.is_dir })) : [] } };
        case 'read_file_from_mcp':
          return { ...newState, currentView: 'files', files: { ...newState.files, currentFile: { name: payload.args.path, content: payload.content || '' } } };
        case 'write_file_to_mcp':
          return { ...newState, currentView: 'files', files: { ...newState.files, currentFile: { name: payload.args.path, content: payload.args.content || '' } } };
        case 'create_directory_mcp':
        case 'move_item_mcp':
        case 'delete_item_mcp':
          return newState;
        default:
          return newState;
      }
    }
    default:
      return state;
  }
}

// Hook
export const useAgentDesktop = (mcpUrl: string): [AgentDesktopState, React.Dispatch<AgentDesktopAction>] => {
  const [state, dispatch] = useReducer(agentDesktopReducer, initialState);

  // Effect to load files when view changes to 'files'
  useEffect(() => {
    if (state.currentView === 'files' && mcpUrl) {
      const fetchFiles = async () => {
        const result = await listFiles(mcpUrl, '.');
        if (result.files) {
          dispatch({ type: 'API_ACTION', payload: { type: 'list_directory_mcp', files: result.files.map(file => ({ name: file.name, isDirectory: file.is_dir })) } });
        } else if (result.error) {
          dispatch({ type: 'API_ACTION', payload: { type: 'list_files', error: result.error } });
        }
      };
      fetchFiles();
    }
  }, [state.currentView, mcpUrl]);

  return [state, dispatch];
};