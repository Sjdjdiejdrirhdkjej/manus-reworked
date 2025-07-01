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
  {
    name: 'search',
    description: 'Search files in the codebase',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      try {
        const pattern = params.pattern as string;
        return {
          status: 'success',
          output: `Search results for pattern: ${pattern}`
        };
      } catch (error) {
        return {
          status: 'error',
          output: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'analyze',
    description: 'Analyze code quality and suggest improvements',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      try {
        return {
          status: 'success',
          output: `Analysis results for code: ${params.code}`
        };
      } catch (error) {
        return {
          status: 'error',
          output: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  {
    name: 'git',
    description: 'Perform git operations',
    async execute(params: Record<string, any>): Promise<ToolResult> {
      try {
        const command = params.command as string;
        return {
          status: 'success',
          output: `Git command executed: ${command}`
        };
      } catch (error) {
        return {
          status: 'error',
          output: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];