
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.replit.dev", "https://*.replit.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Mistral client
api_key = os.getenv("MISTRAL_API_KEY")
if not api_key:
    print("Warning: MISTRAL_API_KEY environment variable not set")
    client = None
else:
    client = MistralClient(api_key=api_key)

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(message: ChatMessage):
    if not client:
        return ChatResponse(response="Mistral AI is not configured. Please set the MISTRAL_API_KEY environment variable.")
    
    try:
        # Create chat messages for Mistral
        messages = [
            ChatMessage(role="user", content=message.message)
        ]
        
        # Get response from Mistral AI
        chat_response = client.chat(
            model="mistral-tiny",  # You can use "mistral-small" or "mistral-medium" for better performance
            messages=messages,
        )
        
        ai_response = chat_response.choices[0].message.content
        return ChatResponse(response=ai_response)
        
    except Exception as e:
        print(f"Error calling Mistral AI: {e}")
        raise HTTPException(status_code=500, detail="Error processing your request with Mistral AI")
