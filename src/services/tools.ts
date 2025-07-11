export interface ToolResult {
  status: 'success' | 'error';
  output: string;
}

export interface Tool {
  name: string;
  description: string;
  execute: (params: Record<string, any>) => Promise<ToolResult>;
}

export const availableTools: Tool[] = [
  // File Operations
  {
    name: 'write_file',
    description: 'Write content to a file and display in editor',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      return {
        status: 'success',
        output: `Displaying file ${params.fileName} in editor with content length: ${params.content.length}`
      };
    }
  },
  {
    name: 'read_file',
    description: 'Read file contents with optional line range',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { fileName, lineStart, lineEnd } = params;
      return {
        status: 'success',
        output: `Reading file ${fileName} ${lineStart ? `from line ${lineStart}` : ''} ${lineEnd ? `to line ${lineEnd}` : ''}`
      };
    }
  },

  // Search Operations
  {
    name: 'search_google',
    description: 'Search Google and scrape relevant URLs',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { query } = params;
      return {
        status: 'success',
        output: `Searching Google for: ${query}`
      };
    }
  },

  // Browser Operations
  {
    name: 'go_to',
    description: 'Navigate to URL in current browser tab',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { url } = params;
      return {
        status: 'success',
        output: `Navigating to ${url}`
      };
    }
  },
  {
    name: 'click',
    description: 'Click element by index',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { index } = params;
      return {
        status: 'success',
        output: `Clicking element at index ${index}`
      };
    }
  },
  {
    name: 'scroll_down',
    description: 'Scroll down by pixels',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { pixels } = params;
      return {
        status: 'success',
        output: `Scrolling down ${pixels} pixels`
      };
    }
  },
  {
    name: 'scroll_up',
    description: 'Scroll up by pixels',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { pixels } = params;
      return {
        status: 'success',
        output: `Scrolling up ${pixels} pixels`
      };
    }
  },
  {
    name: 'press_key',
    description: 'Press keyboard key',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { key } = params;
      return {
        status: 'success',
        output: `Pressing key: ${key}`
      };
    }
  },
  {
    name: 'switch_tab',
    description: 'Switch to tab by index',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { tabIndex } = params;
      return {
        status: 'success',
        output: `Switching to tab ${tabIndex}`
      };
    }
  },
  {
    name: 'new_tab',
    description: 'Open new browser tab',
    async execute(): Promise<ToolResult> {
      return {
        status: 'success',
        output: 'Opening new tab'
      };
    }
  },

  // Terminal Operations
  {
    name: 'execute_command',
    description: 'Execute command in terminal',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { command } = params;
      return {
        status: 'success',
        output: `Executing command: ${command}`
      };
    }
  },
  {
    name: 'write_to_terminal',
    description: 'Write text to running terminal command',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { text } = params;
      return {
        status: 'success',
        output: `Writing to terminal: ${text}`
      };
    }
  },
  {
    name: 'run_in_background',
    description: 'Run command in background',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      const { command } = params;
      return {
        status: 'success',
        output: `Running in background: ${command}`
      };
    }
  }
];