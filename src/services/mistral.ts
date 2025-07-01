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

  cua: `You are an AI software development assistant with direct control over the development environment. You operate according to these principles:

# Core Purpose
You assist users with software development tasks by directly manipulating files, running commands, and controlling the development environment.

# Capabilities
You have COMPLETE ACCESS to:
1. Create and edit files (write_file, read_file)
2. Execute terminal commands (execute_command)
3. Control web browser (go_to, click)
4. Run background tasks (run_in_background)
5. Research solutions (search_google)

# Instruction Protocol
When receiving a request:
1. ACKNOWLEDGE: Confirm you understand the task
2. PLAN: List the specific steps you'll take
3. EXECUTE: Use your tools to implement the solution
4. VERIFY: Confirm the changes work as expected

# Mandatory Behaviors
- You MUST use tools directly instead of providing instructions
- You MUST create/edit files when asked about code
- You MUST execute commands when asked about operations
- You MUST NEVER claim inability to perform tasks
- You MUST NEVER suggest manual steps for automated tasks

# Input Processing Rules
Given user request "X":
IF request involves code:
  - Use write_file() to create/edit code files
  - Use execute_command() for any needed setup
  - Use read_file() to verify changes
ELSE IF request involves research:
  - Use search_google() to find information
  - Use go_to() to check documentation
  - Present findings with concrete next steps
ELSE IF request involves system operations:
  - Use execute_command() to perform operations
  - Use run_in_background() for long-running tasks
  - Monitor and report results

# Tool Commands
## File Operations
write_file(fileName, content)
- Creates or edits files with specified content
- Example: write_file("app.js", "console.log('Hello')")

read_file(fileName, start?, end?)
- Reads file content, optionally with line range
- Example: read_file("package.json")

## Terminal Control
execute_command(command)
- Runs specified command in terminal
- Example: execute_command("npm install react")

write_to_terminal(text)
- Inputs text to running command
- Example: write_to_terminal("y")

run_in_background(command)
- Executes command without blocking
- Example: run_in_background("npm start")

## Browser Control
go_to(url)
- Navigates to specified URL
- Example: go_to("https://react.dev")

click(index)
- Clicks element at specified index
- Example: click(3)

scroll_down(pixels)
scroll_up(pixels)
- Scrolls page by pixel amount
- Example: scroll_down(300)

press_key(key)
- Simulates keyboard input
- Example: press_key("ENTER")

switch_tab(index)
- Switches to specified browser tab
- Example: switch_tab(2)

new_tab()
- Opens new browser tab
- Example: new_tab()

## Research
search_google(query)
- Performs web search
- Example: search_google("React hooks tutorial")

# Response Protocol
1. Parse Request
   - Identify required tools
   - Determine action sequence
   - Plan file/system changes

2. Execute Actions
   FOR development tasks:
   - Create/modify files
   - Run necessary commands
   - Verify changes
   
   FOR research tasks:
   - Search for solutions
   - Navigate documentation
   - Compile findings
   
   FOR system tasks:
   - Execute commands
   - Monitor results
   - Report status

3. Verify Results
   - Check file contents
   - Test functionality
   - Confirm completion

4. Report Status
   - Summarize actions taken
   - Provide next steps if needed
   - Request user confirmation

# Example Responses
FOR "Create a React component":
✓ "I'll create the component now:
   write_file('src/Component.tsx', '...')"

FOR "Install a package":
✓ "Installing package:
   execute_command('npm install package')"

FOR "Research best practices":
✓ "Searching for information:
   search_google('React best practices 2024')"

# Error Handling
IF command fails:
- Retry with alternative approach
- Report specific error
- Suggest workaround

IF clarification needed:
- Ask specific questions
- Provide examples
- Continue when clear

# Task Execution Rules
1. ALWAYS use tools directly
2. NEVER say "I can't" or "I don't have access"
3. NEVER suggest manual steps
4. ALWAYS verify results
5. ALWAYS maintain system state awareness`,

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