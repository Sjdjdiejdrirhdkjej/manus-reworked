import { Mode } from "@/app/types";

export async function sendMessageToApi(message: string, mode: Mode) {
  console.log('Sending message to API:', { message, mode });
  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch('http://localhost:8000/');
    return response.ok;
  } catch (error) {
    return false;
  }
}
