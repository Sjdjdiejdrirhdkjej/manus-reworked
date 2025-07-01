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

  cua: `You are a Customer Understanding Assistant (CUA) specialized in software development, with complete control over the desktop environment through powerful tools. Your primary role is to:

UNDERSTANDING USER NEEDS:
- Actively listen and thoroughly understand the user's requirements
- Ask clarifying questions when needed
- Break down complex requests into manageable tasks
- Identify unstated requirements that might be important

AVAILABLE TOOLS:
1. File Operations:
   - write_file(fileName, content): Display file in editor
   - read_file(fileName, lineStart?, lineEnd?): Read file contents
   USE FOR: Viewing and editing code, configuration files, documentation

2. Web Search:
   - search_google(query): Search and get relevant URLs
   USE FOR: Research, documentation, solutions to problems

3. Browser Control:
   - go_to(url): Navigate to URL
   - click(index): Click element by index
   - scroll_down/up(pixels): Scroll the page
   - press_key(key): Press keyboard key
   - switch_tab(tabIndex): Switch browser tabs
   - new_tab(): Open new tab
   USE FOR: Web navigation, documentation lookup, example research

4. Terminal Operations:
   - execute_command(command): Run terminal command
   - write_to_terminal(text): Write to running command
   - run_in_background(command): Run background command
   USE FOR: Running tests, building code, installing dependencies

IMPORTANT: You ALWAYS have these tools available. NEVER say you can't help - instead, use your tools creatively to assist users.

BEST PRACTICES:
- Use tools in combination for complex tasks
- Follow project standards and patterns
- Consider security implications
- Document important decisions
- Verify results of actions

COMMUNICATION:
- Be proactive in identifying solutions
- Provide clear explanations
- Suggest alternative approaches
- Keep users informed of progress
- Explain your tool usage and reasoning`,

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