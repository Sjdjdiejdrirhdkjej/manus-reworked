'use client';

import { useReducer } from 'react';

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

export type AgentDesktopState = {
  isSidebarOpen: boolean;
  activities: Activity[];
  currentView: 'terminal' | 'browser' | 'files';
  terminal: {
    output: string[];
  };
  browser: {
    url: string;
    screenshot?: string;
  };
  files: {
    currentFile: FileData | null;
    fileTree: any[]; // Simplified for now
  };
};

export type AgentDesktopAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_VIEW'; payload: AgentDesktopState['currentView'] }
  | { type: 'API_ACTION'; payload: any };

// Initial State
const initialState: AgentDesktopState = {
  isSidebarOpen: true,
  activities: [],
  currentView: 'terminal',
  terminal: {
    output: ['Welcome to the virtual terminal.'],
  },
  browser: {
    url: 'https://www.google.com',
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
          return { ...newState, currentView: 'terminal', terminal: { ...newState.terminal, output: [...newState.terminal.output, `$ ${payload.args.command}`, payload.result] } };
        case 'list_files':
          return { ...newState, currentView: 'files', files: { ...newState.files, fileTree: payload.files } };
        case 'read_file':
          return { ...newState, currentView: 'files', files: { ...newState.files, currentFile: { name: payload.args.file_name, content: payload.content } } };
        case 'write_to_file':
        case 'create_file':
          return { ...newState, currentView: 'files', files: { ...newState.files, currentFile: { name: payload.args.file_name, content: payload.args.content || '' } } };
        case 'go_to':
        case 'search_google':
          return { ...newState, currentView: 'browser', browser: { ...newState.browser, url: payload.args.url || `https://www.google.com/search?q=${payload.args.query}` } };
        case 'take_screenshot':
          return { ...newState, currentView: 'browser', browser: { ...newState.browser, screenshot: payload.screenshot } };
        default:
          return newState;
      }
    }
    default:
      return state;
  }
}

// Hook
export const useAgentDesktop = () => {
  return useReducer(agentDesktopReducer, initialState);
};