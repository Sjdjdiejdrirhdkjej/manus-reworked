import { Mode } from "@/app/types";

export async function sendMessageToApi(message: string, mode: Mode) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, mode }),
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response.json();
}
