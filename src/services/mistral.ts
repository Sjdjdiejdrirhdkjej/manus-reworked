export type ChatMode = 'chat' | 'cua' | 'high-effort';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_API_URL = import.meta.env.VITE_MISTRAL_API_URL || 'https://api.mistral.ai/v1';

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  chat: "You are a helpful chat assistant.",
  cua: "You are a customer understanding assistant with access to development tools. You can search files, analyze code, and perform git operations.",
  'high-effort': "You are an assistant focused on providing detailed analysis with access to development tools. You can search files, analyze code, and perform git operations."
};

import { availableTools } from './tools';

export async function getChatResponse(message: string, mode: ChatMode): Promise<string> {
  // Check if message starts with a tool command
  const toolMatch = message.match(/^(search files:|analyze code:|git:)\s*(.+)$/i);
  if (toolMatch && (mode === 'cua' || mode === 'high-effort')) {
    const [, command, param] = toolMatch;
    const toolName = command.toLowerCase().replace(/[^a-z]/g, '');
    const tool = availableTools.find(t => t.name === toolName);
    
    if (tool) {
      try {
        const result = await tool.execute({ 
          pattern: param,
          code: param,
          command: param
        });
        return result.output;
      } catch (error) {
        return `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
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