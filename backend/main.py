
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mistralai import Mistral

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
api_key = os.getenv("MISTRAL_API_KEY")
if not api_key:
    print("Warning: MISTRAL_API_KEY environment variable not set")
    client = None
else:
    client = Mistral(api_key=api_key)

class ChatMessage(BaseModel):
    message: str
    mode: str = "chat"  # chat, cua, high-effort, daytona

class ChatResponse(BaseModel):
    response: str
    tools_used: list = []
    desktop_action: dict = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(message: ChatMessage):
    if not client:
        return ChatResponse(response="Mistral AI is not configured. Please set the MISTRAL_API_KEY environment variable.")
    
    try:
        # Define tools for Daytona mode
        tools = []
        system_message = ""
        
        if message.mode == "daytona":
            system_message = """You are an AI assistant with desktop control capabilities. The following commands will ONLY be used to control the desktop with examples:

File editing (following commands will show file editor (non-editable)):
- write_to_file(FILE_NAME, CONTENT): the desktop will switch to file editing mode and will display the file's contents along with syntax highlighting
- read_file(FILE_NAME, LINE_START(OPTIONAL, DEFAULT ALL), LINE_END(OPTIONAL, DEFAULT ALL)): Reads the file with the file name with optional args line start and line end. These will be added to the context memory

Search (uses free Google search to scrape any relevant URLs):
- search_google(QUERY): Searches Google for the specified query

Browser (following actions will show the browser):
- go_to(URL): Navigates to URL in current tab
- click(INDEX): After the page has been highlighted with boxes along with their indexes, the system will click the element with that index
- scroll_down(PIXELS): Scrolls down by pixels
- scroll_up(PIXELS): Scrolls up by pixels
- press_key(ENTER): Presses enter like when in a search engine
- switch_tab(TAB_INDEX): Switches tab to tab index starting from the left, increasing from left to right
- new_tab(): Opens a new tab

Terminal (following actions will show the terminal except run_in_background):
- execute_command(COMMAND): Executes the command
- write_to_terminal(TEXT): If the command ran needs confirmation, using this command will write the text into the existing running command without stopping it/restarting it
- run_in_background(COMMAND): This action wont be displayed in the desktop as it will be running in the background. Use this only when needed.

Browser-use, file management and terminal commands will be sent directly to Daytona, with live-streaming, file content, browser view and the terminal."""

            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "write_to_file",
                        "description": "Write content to a file and display in file editor",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "file_name": {"type": "string", "description": "Name of the file to write to"},
                                "content": {"type": "string", "description": "Content to write to the file"}
                            },
                            "required": ["file_name", "content"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "read_file",
                        "description": "Read file content with optional line range",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "file_name": {"type": "string", "description": "Name of the file to read"},
                                "line_start": {"type": "integer", "description": "Starting line number (optional)"},
                                "line_end": {"type": "integer", "description": "Ending line number (optional)"}
                            },
                            "required": ["file_name"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "search_google",
                        "description": "Search Google for information",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string", "description": "Search query"}
                            },
                            "required": ["query"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "go_to",
                        "description": "Navigate to a URL in browser",
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
                        "name": "click",
                        "description": "Click element by index",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "index": {"type": "integer", "description": "Index of element to click"}
                            },
                            "required": ["index"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "scroll_down",
                        "description": "Scroll down by pixels",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "pixels": {"type": "integer", "description": "Number of pixels to scroll down"}
                            },
                            "required": ["pixels"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "scroll_up",
                        "description": "Scroll up by pixels",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "pixels": {"type": "integer", "description": "Number of pixels to scroll up"}
                            },
                            "required": ["pixels"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "press_key",
                        "description": "Press a key",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "key": {"type": "string", "description": "Key to press (e.g., ENTER)"}
                            },
                            "required": ["key"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "switch_tab",
                        "description": "Switch to a specific tab",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "tab_index": {"type": "integer", "description": "Index of tab to switch to"}
                            },
                            "required": ["tab_index"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "new_tab",
                        "description": "Open a new tab",
                        "parameters": {
                            "type": "object",
                            "properties": {}
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "execute_command",
                        "description": "Execute a terminal command",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "command": {"type": "string", "description": "Command to execute"}
                            },
                            "required": ["command"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "write_to_terminal",
                        "description": "Write text to running terminal command",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "text": {"type": "string", "description": "Text to write to terminal"}
                            },
                            "required": ["text"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "run_in_background",
                        "description": "Run command in background",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "command": {"type": "string", "description": "Command to run in background"}
                            },
                            "required": ["command"]
                        }
                    }
                }
            ]
        
        # Create chat messages for Mistral
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": message.message})
        
        # Get response from Mistral AI using the new client
        chat_params = {
            "model": "mistral-small",
            "messages": messages,
        }
        
        if tools:
            chat_params["tools"] = tools
        
        chat_response = client.chat.complete(**chat_params)
        
        ai_response = chat_response.choices[0].message.content
        tools_used = []
        desktop_action = None
        
        # Check if tools were used
        if hasattr(chat_response.choices[0].message, 'tool_calls') and chat_response.choices[0].message.tool_calls:
            for tool_call in chat_response.choices[0].message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = tool_call.function.arguments
                tools_used.append({"name": tool_name, "args": tool_args})
                
                # Set desktop action for frontend
                desktop_action = {
                    "type": tool_name,
                    "args": tool_args
                }
        
        return ChatResponse(response=ai_response, tools_used=tools_used, desktop_action=desktop_action or {})
        
    except Exception as e:
        print(f"Error calling Mistral AI: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing your request with Mistral AI: {str(e)}")

# Vercel serverless function handler
handler = app
