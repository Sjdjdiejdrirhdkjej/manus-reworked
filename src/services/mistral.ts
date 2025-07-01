const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY;
const MISTRAL_API_URL = import.meta.env.VITE_MISTRAL_API_URL || 'https://api.mistral.ai/v1';

export async function getChatResponse(message: string): Promise<string> {
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
        model: "mistral-tiny",
        messages: [{ role: "user", content: message }]
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