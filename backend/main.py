import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
from mistralai import Mistral
from scrapybara import Scrapybara

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://*.replit.dev", 
        "https://*.replit.app",
        "https://*.vercel.app",
        "https://vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Mistral client
mistral_api_key = os.getenv("MISTRAL_API_KEY")
if not mistral_api_key:
    print("Warning: MISTRAL_API_KEY environment variable not set")
    mistral_client = None
else:
    mistral_client = Mistral(api_key=mistral_api_key)

# Initialize Scrapybara client
scrapybara_api_key = os.getenv("SCRAPYBARA_API_KEY")
if not scrapybara_api_key:
    print("Warning: SCRAPYBARA_API_KEY environment variable not set")
    scrapybara_client = None
else:
    scrapybara_client = Scrapybara(api_key=scrapybara_api_key)

class ChatMessage(BaseModel):
    message: str
    mode: str = "chat"  # chat, cua, high-effort, daytona

class ChatResponse(BaseModel):
    response: str
    tools_used: list = []
    desktop_action: Optional[dict] = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(message: ChatMessage):
    if not mistral_client:
        return ChatResponse(response="Mistral AI is not configured. Please set the MISTRAL_API_KEY environment variable.")

    try:
        # Define tools for Scrapybara mode
        tools = []
        system_message = ""

        if message.mode == "daytona":
            if not scrapybara_client:
                return ChatResponse(response="Scrapybara is not configured. Please set the SCRAPYBARA_API_KEY environment variable.")

            system_message = """You are Manus, a powerful AI assistant. You have direct control over a web browser to perform tasks for the user.
When the user asks for something that requires web access, you MUST use the provided tools to answer the request.
Do not ask for permission. Do not explain what you are about to do. Just perform the action.
For example, if the user asks "what's the weather in Paris?", you should use the tools to search for it and provide the answer."""

            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "go_to",
                        "description": "Navigate to a specific URL.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "url": {"type": "string", "description": "URL to navigate to"}
                            },
                            "required": ["url"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "click_element",
                        "description": "Click on an element using CSS selector",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "selector": {"type": "string", "description": "CSS selector of element to click"}
                            },
                            "required": ["selector"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "type_text",
                        "description": "Type text into an input field",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "selector": {"type": "string", "description": "CSS selector of input field"},
                                "text": {"type": "string", "description": "Text to type"}
                            },
                            "required": ["selector", "text"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "scroll_page",
                        "description": "Scroll the page",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "direction": {"type": "string", "description": "Direction to scroll (up/down)"},
                                "amount": {"type": "integer", "description": "Amount to scroll in pixels"}
                            },
                            "required": ["direction", "amount"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "take_screenshot",
                        "description": "Take a screenshot of the current page",
                        "parameters": {
                            "type": "object",
                            "properties": {}
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "extract_text",
                        "description": "Extract text from elements matching the selector",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "selector": {"type": "string", "description": "CSS selector to extract text from"}
                            },
                            "required": ["selector"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "extract_links",
                        "description": "Extract all links from the current page",
                        "parameters": {
                            "type": "object",
                            "properties": {}
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "get_page_title",
                        "description": "Get the current page title",
                        "parameters": {
                            "type": "object",
                            "properties": {}
                        }
                    }
                }
            ]

        # Prepare messages for the API call
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": message.message})

        # Make the API call
        chat_response = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None
        )

        response_message = chat_response.choices[0].message
        tools_used = []
        desktop_action = None

        # Handle tool calls with Scrapybara
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            session = None
            try:
                # Start a new Scrapybara session
                session = scrapybara_client.start_ubuntu()
                
                for tool_call in response_message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)
                    tools_used.append({"name": tool_name, "args": tool_args})

                    # Execute Scrapybara actions with proper session handling
                    try:
                        if tool_name == "go_to":
                            session.navigate(tool_args['url'])
                            result = f"Navigated to {tool_args['url']}"
                        elif tool_name == "click_element":
                            session.click(tool_args['selector'])
                            result = f"Clicked element: {tool_args['selector']}"
                        elif tool_name == "type_text":
                            session.type(tool_args['selector'], tool_args['text'])
                            result = f"Typed '{tool_args['text']}' into {tool_args['selector']}"
                        elif tool_name == "scroll_page":
                            direction = 1 if tool_args['direction'].lower() == 'down' else -1
                            session.scroll(direction * tool_args['amount'])
                            result = f"Scrolled {tool_args['direction']} by {tool_args['amount']} pixels"
                        elif tool_name == "take_screenshot":
                            screenshot_data = session.screenshot()
                            result = "Screenshot taken successfully"
                            desktop_action = {"type": tool_name, "args": tool_args, "result": result, "screenshot": screenshot_data}
                            continue
                        elif tool_name == "extract_text":
                            text_content = session.get_text(tool_args['selector'])
                            result = f"Extracted text: {text_content[:200]}..." if len(text_content) > 200 else f"Extracted text: {text_content}"
                        elif tool_name == "extract_links":
                            links = session.get_links()
                            result = f"Found {len(links)} links on the page"
                        elif tool_name == "get_page_title":
                            title = session.get_title()
                            result = f"Page title: {title}"
                        else:
                            result = f"Unknown tool: {tool_name}"

                        desktop_action = {"type": tool_name, "args": tool_args, "result": result}
                    except Exception as e:
                        desktop_action = {"type": tool_name, "args": tool_args, "error": str(e)}
                        
            except Exception as e:
                desktop_action = {"type": "session_error", "args": {}, "error": f"Failed to start Scrapybara session: {str(e)}"}
            finally:
                # Clean up session
                if session:
                    try:
                        session.close()
                    except:
                        pass

        response_text = response_message.content or "Action completed."

        return ChatResponse(
            response=response_text,
            tools_used=tools_used,
            desktop_action=desktop_action
        )

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(response=f"Sorry, there was an error: {str(e)}")

# Vercel serverless function handler
handler = app