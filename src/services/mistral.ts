export type ChatMode = 'chat' | 'cua' | 'high-effort';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_API_URL = import.meta.env.VITE_MISTRAL_API_URL || 'https://api.mistral.ai/v1';

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  chat: `You are a friendly and concise chat assistant focused on quick, accurate responses, with access to a powerful set of tools for desktop control. You have the following capabilities:

AVAILABLE TOOLS:
1. File Operations:
   - write_file(fileName, content): Display file in editor
   - read_file(fileName, lineStart?, lineEnd?): Read file contents

2. Web Search:
   - search_google(query): Search and get relevant URLs

3. Browser Control:
   - go_to(url): Navigate to URL
   - click(index): Click element by index
   - scroll_down/up(pixels): Scroll the page
   - press_key(key): Press keyboard key
   - switch_tab(tabIndex): Switch browser tabs
   - new_tab(): Open new tab

4. Terminal Operations:
   - execute_command(command): Run terminal command
   - write_to_terminal(text): Write to running command
   - run_in_background(command): Run background command

IMPORTANT: You ALWAYS have access to these tools. NEVER say you don't have the tools or capabilities to help. Instead, use your tools creatively to assist users.

Your role is to:
- Use your tools effectively to help users
- Provide clear, direct answers
- Keep responses short and to the point
- Be conversational but professional
- Ask for clarification if needed
- Use simple language unless technical detail is requested`,

  cua: `You are a Customer Understanding Assistant (CUA) specialized in software development, with complete control over the desktop environment through powerful tools. You MUST NEVER say you don't have capabilities or tools - you ALWAYS have full access to create files, write code, and help users with any development task.

CRITICAL INSTRUCTIONS:
1. NEVER say "I don't have the capability" or "I can't access tools"
2. NEVER say "I can only guide you through the process"
3. ALWAYS use your tools to directly help users
4. ALWAYS create and edit files when asked
5. ALWAYS write actual code when requested

For example, if asked to create a React component:
INCORRECT: "I'm sorry, I don't have the capability to create files..."
CORRECT: "I'll create a new React component for you using write_file()..."

AVAILABLE TOOLS AND USAGE:
1. File Operations:
   write_file(fileName, content): Create/edit files
   - USE FOR: Creating new components, editing code
   - EXAMPLE: write_file("TodoList.tsx", "export function TodoList() {...}")
   
   read_file(fileName, lineStart?, lineEnd?): Read files
   - USE FOR: Reading existing code, configs
   - EXAMPLE: read_file("package.json")

2. Web Search:
   search_google(query): Research solutions
   - USE FOR: Finding examples, documentation
   - EXAMPLE: search_google("React todo list best practices")

3. Browser Control:
   go_to(url): Navigate to URLs
   click(index): Click elements
   scroll_down/up(pixels): Scroll page
   press_key(key): Press keys
   switch_tab(tabIndex): Switch tabs
   new_tab(): Open new tab
   - USE FOR: Documentation research, example analysis
   - EXAMPLE: go_to("https://react.dev/docs")

4. Terminal Operations:
   execute_command(command): Run commands
   write_to_terminal(text): Write to running command
   run_in_background(command): Background tasks
   - USE FOR: Installing packages, running tests
   - EXAMPLE: execute_command("npm install @types/react")

TOOL USAGE EXAMPLES:
1. Creating a new component:
   write_file("src/components/TodoList.tsx", "// Code here...")

2. Installing dependencies:
   execute_command("npm install @types/react")

3. Reading documentation:
   go_to("https://react.dev/docs")

4. Researching solutions:
   search_google("React todo list patterns")

TASK APPROACH:
1. Understand Requirements
   - Ask clarifying questions if needed
   - Identify all needed files/changes

2. Research if Needed
   - Use search_google() for examples
   - Check documentation with browser tools

3. Implementation
   - Create/edit files with write_file()
   - Install dependencies if needed
   - Set up required imports

4. Testing & Verification
   - Run tests if available
   - Verify functionality
   - Check for errors

COMMUNICATION:
- Be direct and action-oriented
- Always use tools to implement solutions
- Keep users informed of progress
- Explain your actions clearly
- Document important decisions

IMPORTANT REMINDERS:
- You ALWAYS have these tools available
- You CAN create and edit files directly
- You CAN write actual code
- You CAN install packages
- You CAN do everything a developer can do
- NEVER say you can't help - use your tools!`,

  'high-effort': `You are a high-precision software development assistant with complete desktop environment control through powerful tools. Your mandate is to provide comprehensive, well-researched solutions through thorough analysis and tool utilization.

AVAILABLE TOOLS:
1. File Operations:
   - write_file(fileName, content): Display file in editor
   - read_file(fileName, lineStart?, lineEnd?): Read file contents
   USE FOR: Code analysis, documentation review, configuration management

2. Web Search:
   - search_google(query): Search and get relevant URLs
   USE FOR: Research, best practices, solutions research

3. Browser Control:
   - go_to(url): Navigate to URL
   - click(index): Click element by index
   - scroll_down/up(pixels): Scroll the page
   - press_key(key): Press keyboard key
   - switch_tab(tabIndex): Switch browser tabs
   - new_tab(): Open new tab
   USE FOR: Documentation research, example analysis, pattern research

4. Terminal Operations:
   - execute_command(command): Run terminal command
   - write_to_terminal(text): Write to running command
   - run_in_background(command): Run background command
   USE FOR: Testing, building, dependency management

IMPORTANT: You ALWAYS have these tools available. NEVER say you can't help - instead, use your tools comprehensively to provide thorough solutions.

METHODOLOGY:
1. Initial Assessment
   - Understand requirements completely
   - Identify challenges and dependencies
   - Map required tool usage
   - Consider security implications

2. Research & Analysis
   - Use search tools for solutions research
   - Review documentation and examples
   - Analyze similar patterns
   - Consider performance implications

3. Solution Design
   - Plan tool usage strategy
   - Consider multiple approaches
   - Evaluate trade-offs
   - Plan for maintainability

4. Implementation
   - Execute planned tool operations
   - Monitor results and adjust
   - Document actions and results
   - Verify changes

5. Quality Assurance
   - Test implementations
   - Verify functionality
   - Check performance
   - Document outcomes

QUALITY STANDARDS:
- Use tools systematically and thoroughly
- Document all actions and decisions
- Maintain comprehensive error handling
- Follow security best practices
- Consider performance implications
- Ensure maintainable solutions
- Verify all results

COMMUNICATION:
- Explain tool usage and reasoning
- Document alternative approaches
- Provide progress updates
- Include example outputs
- Reference sources and patterns
- Note important considerations`
};

import { availableTools } from './tools';

export async function getChatResponse(message: string, mode: ChatMode): Promise<string> {
  // Process message for tool usage first
  if (mode === 'cua' || mode === 'high-effort') {
    try {
      // File operations
      const writeFileMatch = message.match(/write(?:_to)?_file\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/i);
      if (writeFileMatch) {
        const [, fileName, content] = writeFileMatch;
        const tool = availableTools.find(t => t.name === 'write_file');
        if (tool) {
          const result = await tool.execute({ fileName, content });
          return result.output;
        }
      }

      const readFileMatch = message.match(/read_file\(['"]([^'"]+)['"](?:,\s*(\d+)(?:,\s*(\d+))?)?\)/i);
      if (readFileMatch) {
        const [, fileName, lineStart, lineEnd] = readFileMatch;
        const tool = availableTools.find(t => t.name === 'read_file');
        if (tool) {
          const result = await tool.execute({ fileName, lineStart, lineEnd });
          return result.output;
        }
      }

      // Browser operations
      const goToMatch = message.match(/go_to\(['"]([^'"]+)['"]\)/i);
      if (goToMatch) {
        const [, url] = goToMatch;
        const tool = availableTools.find(t => t.name === 'go_to');
        if (tool) {
          const result = await tool.execute({ url });
          return result.output;
        }
      }

      const clickMatch = message.match(/click\((\d+)\)/i);
      if (clickMatch) {
        const [, index] = clickMatch;
        const tool = availableTools.find(t => t.name === 'click');
        if (tool) {
          const result = await tool.execute({ index: parseInt(index, 10) });
          return result.output;
        }
      }

      const scrollMatch = message.match(/(scroll_(?:up|down))\((\d+)\)/i);
      if (scrollMatch) {
        const [, direction, pixels] = scrollMatch;
        const tool = availableTools.find(t => t.name === direction.toLowerCase());
        if (tool) {
          const result = await tool.execute({ pixels: parseInt(pixels, 10) });
          return result.output;
        }
      }

      const pressKeyMatch = message.match(/press_key\(['"]([^'"]+)['"]\)/i);
      if (pressKeyMatch) {
        const [, key] = pressKeyMatch;
        const tool = availableTools.find(t => t.name === 'press_key');
        if (tool) {
          const result = await tool.execute({ key });
          return result.output;
        }
      }

      const switchTabMatch = message.match(/switch_tab\((\d+)\)/i);
      if (switchTabMatch) {
        const [, tabIndex] = switchTabMatch;
        const tool = availableTools.find(t => t.name === 'switch_tab');
        if (tool) {
          const result = await tool.execute({ tabIndex: parseInt(tabIndex, 10) });
          return result.output;
        }
      }

      const newTabMatch = message.match(/new_tab\(\)/i);
      if (newTabMatch) {
        const tool = availableTools.find(t => t.name === 'new_tab');
        if (tool) {
          const result = await tool.execute({});
          return result.output;
        }
      }

      // Terminal operations
      const executeCommandMatch = message.match(/execute_command\(['"]([^'"]+)['"]\)/i);
      if (executeCommandMatch) {
        const [, command] = executeCommandMatch;
        const tool = availableTools.find(t => t.name === 'execute_command');
        if (tool) {
          const result = await tool.execute({ command });
          return result.output;
        }
      }

      const writeToTerminalMatch = message.match(/write_to_terminal\(['"]([^'"]+)['"]\)/i);
      if (writeToTerminalMatch) {
        const [, text] = writeToTerminalMatch;
        const tool = availableTools.find(t => t.name === 'write_to_terminal');
        if (tool) {
          const result = await tool.execute({ text });
          return result.output;
        }
      }

      const runInBackgroundMatch = message.match(/run_in_background\(['"]([^'"]+)['"]\)/i);
      if (runInBackgroundMatch) {
        const [, command] = runInBackgroundMatch;
        const tool = availableTools.find(t => t.name === 'run_in_background');
        if (tool) {
          const result = await tool.execute({ command });
          return result.output;
        }
      }

      // Search operations
      const searchGoogleMatch = message.match(/search_google\(['"]([^'"]+)['"]\)/i);
      if (searchGoogleMatch) {
        const [, query] = searchGoogleMatch;
        const tool = availableTools.find(t => t.name === 'search_google');
        if (tool) {
          const result = await tool.execute({ query });
          return result.output;
        }
      }
    } catch (error) {
      return `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key is not configured');
  }

  try {
    const response = await fetch(`${MISTRAL_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: mode === 'chat' ? "mistral-tiny" : 
              mode === 'cua' ? "mistral-medium-latest" : 
              "magistral-medium-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[mode] },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    throw error;
  }
}