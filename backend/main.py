
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.replit.dev", "https://*.replit.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(message: ChatMessage):
    # Simple echo response for now - you can integrate your AI logic here
    response = f"Backend received: {message.message}"
    return ChatResponse(response=response)
