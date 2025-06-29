import { Mode } from "@/app/types";

export async function sendMessageToApi(message: string, mode: Mode, mistralApiKey: string, mcpUrl: string) {
  console.log('Sending message to API:', { message, mode });
  const baseUrl = mcpUrl || ''; // Use mcpUrl if provided, otherwise empty string for relative path
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (mistralApiKey) {
      headers['X-Mistral-API-Key'] = mistralApiKey;
    }

    const response = await fetch(`${baseUrl}/chat`, {
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

export async function checkBackendStatus(mcpUrl: string) {
  const baseUrl = mcpUrl || ''; // Use mcpUrl if provided, otherwise empty string for relative path
  try {
    const response = await fetch(`${baseUrl}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
}