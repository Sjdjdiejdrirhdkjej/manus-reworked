import { Mode } from "@/app/types";

export async function sendMessageToApi(message: string, mode: Mode, mistralApiKey: string) {
  console.log('Sending message to API:', { message, mode });
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (mistralApiKey) {
      headers['X-Mistral-API-Key'] = mistralApiKey;
    }

    // This still goes to the main backend (AI service)
    const response = await fetch(`/chat`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ message, mode }),
    });

    console.log('Raw API Response:', response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response Text:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response Data:', data);
    return data;
  } catch (error) {
    console.error('Error sending message to API:', error);
    throw error;
  }
}

export async function checkBackendStatus() {
  try {
    // This checks the main backend's root endpoint
    const response = await fetch('/');
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function checkMcpServerStatus(mcpUrl: string): Promise<boolean> {
  if (!mcpUrl) {
    return false;
  }
  try {
    const response = await fetch(`${mcpUrl}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// --- New functions for MCP Server interactions ---

interface McpApiResponse {
  result?: string;
  content?: string;
  error?: string;
}

async function callMcpApi(mcpUrl: string, endpoint: string, data: any): Promise<McpApiResponse> {
  if (!mcpUrl) {
    return { error: "MCP Server URL not provided." };
  }
  try {
    const response = await fetch(`${mcpUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `MCP API Error: ${response.status} - ${errorText}` };
    }
    return await response.json();
  } catch (error: any) {
    return { error: `Failed to connect to MCP server: ${error.message}` };
  }
}

export async function executeCommand(mcpUrl: string, command: string): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'execute_command', { command });
}

export async function writeToFile(mcpUrl: string, path: string, content: string): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/write_file', { path, content });
}

export async function readFile(mcpUrl: string, path: string): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/read_file', { path });
}

export async function listFiles(mcpUrl: string, path: string = '.'): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/list_directory', { path });
}

export async function createDirectory(mcpUrl: string, path: string): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/create_directory', { path });
}

export async function moveItem(mcpUrl: string, path: string, newPath: string): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/move_item', { path, new_path: newPath });
}

export async function deleteItem(mcpUrl: string, path: string, isDir: boolean = false): Promise<McpApiResponse> {
  return callMcpApi(mcpUrl, 'fs/delete_item', { path, is_dir: isDir });
}
