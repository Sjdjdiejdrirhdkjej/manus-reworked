import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
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
    desktop_actions: Optional[List[dict]] = None
    thinking: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(message: ChatMessage):
    if not mistral_client:
        return ChatResponse(response="Mistral AI is not configured. Please set the MISTRAL_API_KEY environment variable.")

    try:
        # Define tools for Scrapybara
        scrapybara_tools = [
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
            },
            # New desktop-like tools to align with page.tsx
            {
                "type": "function",
                "function": {
                    "name": "execute_command",
                    "description": "Execute a shell command in the virtual terminal environment.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "The shell command to execute"}
                        },
                        "required": ["command"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "write_to_file",
                    "description": "Write content to a specified file in the virtual file system.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_name": {"type": "string", "description": "The name of the file to write to"},
                            "content": {"type": "string", "description": "The content to write into the file"}
                        },
                        "required": ["file_name", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read content from a specified file in the virtual file system.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_name": {"type": "string", "description": "The name of the file to read from"},
                            "line_start": {"type": "integer", "description": "Optional: Starting line number to read (1-indexed)"},
                            "line_end": {"type": "integer", "description": "Optional: Ending line number to read (1-indexed)"}
                        },
                        "required": ["file_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_files",
                    "description": "List files and directories in the current virtual file system path.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path to list (default: current directory)"}
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_directory",
                    "description": "Create a new directory in the virtual file system.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path of the directory to create"}
                        },
                        "required": ["path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "move_file_or_directory",
                    "description": "Move or rename a file or directory in the virtual file system.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "source_path": {"type": "string", "description": "The source path of the file or directory."},
                            "destination_path": {"type": "string", "description": "The destination path for the file or directory."}
                        },
                        "required": ["source_path", "destination_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_file",
                    "description": "Create a new, empty file in the virtual file system.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_name": {"type": "string", "description": "The name of the file to create"}
                        },
                        "required": ["file_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_google",
                    "description": "Perform a Google search for a given query.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "The search query"}
                        },
                        "required": ["query"]
                    }
                }
            }
        ]

        tools = []
        system_message = ""
        thinking_text = None

        # Determine which Mistral model to use based on the selected mode
        model_to_use: str
        if message.mode == "chat":
            model_to_use = "mistral-large-latest"
        elif message.mode == "cua":
            model_to_use = "devstral-small-latest"
            if not scrapybara_client:
                return ChatResponse(response="Scrapybara is not configured. Please set the SCRAPYBARA_API_KEY environment variable.")
            tools = scrapybara_tools
            system_message = "You are a helpful AI assistant. You have access to a web browser, a virtual terminal, and a file system. Use these tools to answer user requests that require web access, command execution, or file management."
        elif message.mode == "high-effort":
            model_to_use = "magistral-medium-latest"
            if not scrapybara_client:
                return ChatResponse(response="Scrapybara is not configured. Please set the SCRAPYBARA_API_KEY environment variable.")
            tools = scrapybara_tools
            system_message = """You are a high-effort AI assistant. Your goal is to provide comprehensive and well-reasoned answers. You have access to web browsing and virtual desktop tools to help you gather information and perform tasks.
First, think step-by-step about the user's query inside a <thinking> XML tag. This is your scratchpad to reason about the problem.
Then, provide your final, user-facing answer inside an <answer> XML tag.
The user will only see the content of the <answer> tag. The <thinking> tag is for your internal process."""
        elif message.mode == "daytona":
            model_to_use = "mistral-large-latest"
            if not scrapybara_client:
                return ChatResponse(response="Scrapybara is not configured. Please set the SCRAPYBARA_API_KEY environment variable.")

            system_message = """You are Manus, a powerful AI assistant. You have direct control over a web browser to perform tasks for the user.
When the user asks for something that requires web access, you MUST use the provided tools to answer the request.
Do not ask for permission. Do not explain what you are about to do. Just perform the action.
For example, if the user asks "what's the weather in Paris?", you should use the tools to search for it and provide the answer."""
            tools = scrapybara_tools
        else: # Default case for any other mode
            model_to_use = "mistral-large-latest"

        # Prepare messages for the API call
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": message.message})

        # Make the API call
        chat_response = mistral_client.chat.complete(
            model=model_to_use,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None
        )

        response_message = chat_response.choices[0].message
        tools_used = []
        desktop_actions_list = [] # Initialize a list to collect all desktop actions
        desktop_action = None

        # Handle tool calls with Scrapybara
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            session = None
            desktop_actions_list = [] # Initialize a list to collect all desktop actions
            try:
                # Start a new Scrapybara session
                session = scrapybara_client.start_ubuntu()
                
                for tool_call in response_message.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)
                    tools_used.append({"name": tool_name, "args": tool_args})
                    current_desktop_action = None # Temporary variable for the current action

                    # Execute Scrapybara actions with proper session handling
                    try:
                        if tool_name == "go_to":
                            session.navigate(tool_args['url'])
                            result = f"Navigated to {tool_args['url']}"
                        elif tool_name == "click_element":
                            session.click(tool_args['selector'], timeout=10) # Added timeout for robustness
                            result = f"Clicked element: {tool_args['selector']}"
                        elif tool_name == "type_text":
                            session.type(tool_args['selector'], tool_args['text'])
                            result = f"Typed '{tool_args['text']}' into {tool_args['selector']}"
                        elif tool_name == "scroll_page":
                            direction = 1 if tool_args['direction'].lower() == 'down' else -1
                            session.scroll(direction * tool_args['amount'], timeout=10) # Added timeout
                            result = f"Scrolled {tool_args['direction']} by {tool_args['amount']} pixels"
                        elif tool_name == "take_screenshot":
                            screenshot_data = session.screenshot()
                            result = "Screenshot taken successfully"
                            current_desktop_action = {"type": tool_name, "args": tool_args, "result": result, "screenshot": screenshot_data}
                        elif tool_name == "extract_text":
                            text_content = session.get_text(tool_args['selector'])
                            result = f"Extracted text: {text_content[:200]}..." if len(text_content) > 200 else f"Extracted text: {text_content}"
                        elif tool_name == "extract_links":
                            links = session.get_links()
                            result = f"Found {len(links)} links on the page"
                        elif tool_name == "list_files":
                            path = tool_args.get('path', '.')
                            files = session.list_files(path)
                            result = f"Files in {path}:\n" + "\n".join(files)
                            current_desktop_action = {"type": tool_name, "args": tool_args, "result": result, "files": files}
                        elif tool_name == "get_page_title":
                            title = session.get_title()
                            result = f"Page title: {title}"
                        elif tool_name == "execute_command":
                            output = session.execute_command(tool_args['command'])
                            result = output
                        elif tool_name == "write_to_file":
                            session.write_file(tool_args['file_name'], tool_args['content'], timeout=10) # Added timeout
                            result = f"Content written to {tool_args['file_name']}"
                        elif tool_name == "read_file":
                            content = session.read_file(tool_args['file_name'], line_start=tool_args.get('line_start'), line_end=tool_args.get('line_end'), timeout=10) # Added timeout
                            result = f"Read content from {tool_args['file_name']}"
                            current_desktop_action = {"type": tool_name, "args": tool_args, "result": result, "content": content}
                        elif tool_name == "create_file":
                            session.write_file(tool_args['file_name'], "", timeout=10) # Create an empty file, added timeout
                            result = f"File created: {tool_args['file_name']}"
                            current_desktop_action = {"type": tool_name, "args": tool_args, "result": result, "content": ""}
                        elif tool_name == "search_google":
                            session.navigate(f"https://www.google.com/search?q={tool_args['query']}")
                            result = f"Performed Google search for: {tool_args['query']}"
                        elif tool_name == "create_directory":
                            session.create_directory(tool_args['path'], timeout=10) # Added timeout for robustness
                            result = f"Directory created: {tool_args['path']}"
                        elif tool_name == "move_file_or_directory":
                            session.move(tool_args['source_path'], tool_args['destination_path'], timeout=10)
                            result = f"Moved {tool_args['source_path']} to {tool_args['destination_path']}"
                        else:
                            result = f"Unknown tool: {tool_name}"

                        # If current_desktop_action was not set by specific tools (like screenshot, read_file, create_file)
                        # then create a generic one.
                        if current_desktop_action is None:
                            current_desktop_action = {"type": tool_name, "args": tool_args, "result": result}
                        
                        desktop_actions_list.append(current_desktop_action)
                    except Exception as e:
                        desktop_actions_list.append({"type": tool_name, "args": tool_args, "error": str(e)})
                        
            except Exception as e:
                desktop_actions_list.append({"type": "session_error", "args": {}, "error": f"Failed to start Scrapybara session: {str(e)}"})
            finally:
                # Clean up session
                if session:
                    try:
                        session.close()
                    except:
                        print(f"Warning: Failed to close Scrapybara session: {e}")

        response_text = response_message.content
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            response_text = response_text or "Action completed."
            # If there were tool calls, and no explicit text response,
            # we might want to indicate that actions were performed.

        # Parse thinking and answer for high-effort mode
        if message.mode == "high-effort" and response_text:
            full_response = response_text
            try:
                thinking_start = full_response.find("<thinking>")
                thinking_end = full_response.find("</thinking>")
                answer_start = full_response.find("<answer>")
                answer_end = full_response.find("</answer>")

                if thinking_start != -1 and thinking_end != -1:
                    thinking_text = full_response[thinking_start + len("<thinking>"):thinking_end].strip()
                
                if answer_start != -1 and answer_end != -1:
                    response_text = full_response[answer_start + len("<answer>"):answer_end].strip()
                elif thinking_text:
                    # Fallback: if no <answer> tag, remove the <thinking> part from the response
                    thinking_block = full_response[thinking_start:thinking_end + len("</thinking>")]
                    response_text = full_response.replace(thinking_block, "").strip()
            except Exception:
                # If parsing fails, just return the full response and no thinking.
                thinking_text = None

        return ChatResponse(
            response=response_text,
            tools_used=tools_used, # This is a list of tool calls made by the model
            desktop_actions=desktop_actions_list if desktop_actions_list else None, # This is the list of results from executing those tools
            thinking=thinking_text
        )

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(response=f"Sorry, there was an error: {str(e)}")

# Vercel serverless function handler
handler = app