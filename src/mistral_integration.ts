import { encode } from 'gpt-3-encoder';
import { Configuration, OpenAIApi } from 'mistralai';
import { AssistantResponse, Message } from './types';

/**
 * MistralAI handling function for the messages and chat app.
 * @param messages - Array of messages to be processed.
 * @returns {Promise<AssistantResponse>}
 */
// Configure the MistralAI API client
const configuration = new Configuration({
  apiKey: 'your-mistral-api-key', // Replace with your actual Mistral API key
  organization: 'your-org-id', // Replace with your organization ID if applicable
});
const openai = new OpenAIApi(configuration);

// Define a function to handle AI messages
async function processMessages(messages: Message[]): Promise<string> {
    try {
        const encodedMessages = userMessages.map(message => encode(message));
        const tokenCount = encodedMessages.reduce((sum, encoded) => sum + encoded.length, 0);

        if (tokenCount > 4096) {
          throw new Error('Message token count exceeds the limit of 4096 tokens.');
        }

        const aiResponse = await openai.createChatCompletion({
          model: 'mistral-ai-model', // Replace with the appropriate MistralAI model name
          messages: messages.map(message => ({
            role: message.sender,
            content: message.text,
          })),
          max_tokens: 150, // Adjust based on the desired response length
          temperature: 0.7, // Adjust based on the desired level of randomness
        });

        return aiResponse.data.choices[0].message?.content || 'No response from MistralAI';
        return response.data;
    } catch (error) {
        console.error('Error processing messages:', error);
        throw new Error('Failed to process messages');
    }
};

// Sleep function for optimization
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export default processMessages;


