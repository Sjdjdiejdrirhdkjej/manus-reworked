import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    mode: str = "chat"  # chat, cua, high-effort, scrapybara

class ChatResponse(BaseModel):
    response: str
    tools_used: list = []
    browser_action: dict = None

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

        if message.mode == "scrapybara":
            if not scrapybara_client:
                return ChatResponse(response="Scrapybara is not configured. Please set the SCRAPYBARA_API_KEY environment variable.")

            system_message = """You are an AI assistant with web browser automation capabilities using Scrapybara. You can perform web scraping, browser navigation, and data extraction tasks. The following commands will control the browser:

Navigation:
- navigate_to(URL): Navigate to a specific URL
- click_element(SELECTOR): Click on an element using CSS selector
- type_text(SELECTOR, TEXT): Type text into an input field
- scroll_page(DIRECTION, AMOUNT): Scroll the page (up/down by amount in pixels)
- take_screenshot(): Take a screenshot of the current page

Data extraction:
- extract_text(SELECTOR): Extract text from elements matching the selector
- extract_links(): Extract all links from the current page
- extract_images(): Extract all image URLs from the current page
- get_page_title(): Get the current page title

Form interaction:
- fill_form(FORM_DATA): Fill out a form with provided data
- submit_form(SELECTOR): Submit a form

Use these tools to help users with web automation, data extraction, and browser-based tasks."""

            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "navigate_to",
                        "description": "Navigate to a specific URL",
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
        if tools:
            chat_response = mistral_client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
                tools=tools,
                tool_choice="auto"
            )
        else:
            chat_response = mistral_client.chat.complete(
                model="mistral-large-latest", 
                messages=messages
            )

        response_message = chat_response.choices[0].message
        tools_used = []
        browser_action = None

        # Handle tool calls with Scrapybara
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = eval(tool_call.function.arguments)
                tools_used.append({"name": tool_name, "args": tool_args})

                # Execute Scrapybara actions
                try:
                    if tool_name == "navigate_to":
                        # Start a new session and navigate
                        session = scrapybara_client.start_ubuntu()
                        result = f"Navigated to {tool_args['url']}"
                    elif tool_name == "take_screenshot":
                        # Take screenshot (would need active session)
                        result = "Screenshot taken"
                    # Add more Scrapybara action implementations here
                    else:
                        result = f"Executed {tool_name} with args {tool_args}"

                    browser_action = {"type": tool_name, "args": tool_args, "result": result}
                except Exception as e:
                    browser_action = {"type": tool_name, "args": tool_args, "error": str(e)}

        response_text = response_message.content or "Action completed."

        return ChatResponse(
            response=response_text,
            tools_used=tools_used,
            browser_action=browser_action
        )

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(response=f"Sorry, there was an error: {str(e)}")

# Vercel serverless function handler
handler = app