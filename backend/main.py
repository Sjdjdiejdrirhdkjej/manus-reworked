import os
import json
import subprocess
import shutil
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mistralai import Mistral

app = FastAPI()

# Load environment variables from .env file
load_dotenv()

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

# --- Tool Implementations (for file system and terminal) ---

# Base directory for file operations in Vercel's ephemeral file system
VERCEL_TMP_DIR = "/tmp"

def _get_full_path(file_name: str) -> str:
    """Helper to get the full path within the Vercel /tmp directory."""
    return os.path.join(VERCEL_TMP_DIR, file_name)

def execute_command(command: str):
    try:
        # Commands are executed in the environment where the function runs
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip() or "Command executed successfully."
    except subprocess.CalledProcessError as e:
        return f"Command failed with error: {e.stderr.strip()}"
    except Exception as e:
        return f"Error executing command: {e}"

def write_to_file(file_name: str, content: str):
    full_path = _get_full_path(file_name)
    try:
        # Ensure directory exists before writing
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)
        return f"Content written to {file_name}"
    except Exception as e:
        return f"Error writing to file {file_name}: {e}"

def read_file(file_name: str, line_start: Optional[int] = None, line_end: Optional[int] = None):
    full_path = _get_full_path(file_name)
    try:
        with open(full_path, 'r') as f:
            lines = f.readlines()
            if line_start is not None and line_end is not None:
                # Adjust for 0-based indexing
                content = "".join(lines[line_start - 1:line_end])
            else:
                content = "".join(lines)
        return {"result": f"Read content from {file_name}", "content": content}
    except FileNotFoundError:
        return f"Error: File not found: {file_name}"
    except Exception as e:
        return f"Error reading file {file_name}: {e}"

def list_files(path: str = '.'):
    # If path is relative, make it relative to VERCEL_TMP_DIR
    if not os.path.isabs(path):
        full_path = _get_full_path(path)
    else:
        full_path = path

    try:
        files = []
        for entry in os.listdir(full_path):
            entry_full_path = os.path.join(full_path, entry)
            if os.path.isdir(entry_full_path):
                files.append(entry + '/') # Indicate directory
            else:
                files.append(entry)
        return f"Files in {path} (within /tmp):\n" + "\n".join(files)
    except FileNotFoundError:
        return f"Error: Directory not found: {path}"
    except Exception as e:
        return f"Error listing files in {path}: {e}"

def create_directory(path: str):
    full_path = _get_full_path(path)
    try:
        os.makedirs(full_path, exist_ok=True)
        return f"Directory created: {path}"
    except Exception as e:
        return f"Error creating directory {path}: {e}"

def move_file_or_directory(source_path: str, destination_path: str):
    full_source_path = _get_full_path(source_path)
    full_destination_path = _get_full_path(destination_path)
    try:
        shutil.move(full_source_path, full_destination_path)
        return f"Moved {source_path} to {destination_path}"
    except FileNotFoundError:
        return f"Error: Source path not found: {source_path}"
    except Exception as e:
        return f"Error moving {source_path} to {destination_path}: {e}"

def create_file(file_name: str):
    full_path = _get_full_path(file_name)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'a') as f:
            pass # Just create an empty file
        return f"File created: {file_name}"
    except Exception as e:
        return f"Error creating file {file_name}: {e}"


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
async def chat(message: ChatMessage, x_mistral_api_key: Optional[str] = Header(None)):
    print(f"Received message: {message.message}, Mode: {message.mode}")
    
    mistral_api_key = x_mistral_api_key
    if not mistral_api_key:
        mistral_api_key = os.getenv("MISTRAL_API_KEY")

    if not mistral_api_key:
        raise HTTPException(status_code=401, detail="Mistral API Key is missing. Please provide it in the X-Mistral-API-Key header or as a MISTRAL_API_KEY environment variable.")

    mistral_client = Mistral(api_key=mistral_api_key)

    try:
        # Define tools for the model (only file system and terminal tools)
        model_tools = [
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
            tools = model_tools
            system_message = "You are a helpful AI assistant. You have access to a virtual terminal, and a file system. Use these tools to answer user requests that require command execution, or file management."
        elif message.mode == "high-effort":
            model_to_use = "magistral-medium-latest"
            tools = model_tools
            system_message = '''You are a high-effort AI assistant. Your goal is to provide comprehensive and well-reasoned answers. You have access to virtual desktop tools to help you gather information and perform tasks.\nFirst, think step-by-step about the user's query inside a <thinking> XML tag. This is your scratchpad to reason about the problem.\nThen, provide your final, user-facing answer inside an <answer> XML tag.\nThe user will only see the content of the <answer> tag. The <thinking> tag is for your internal process.'''
        elif message.mode == "daytona":
            model_to_use = "mistral-large-latest"
            system_message = '''You are Manus, a powerful AI assistant. You have direct control over a virtual terminal and file system to perform tasks for the user.\nWhen the user asks for something that requires command execution or file management, you MUST use the provided tools to answer the request.\nDo not ask for permission. Do not explain what you are about to do. Just perform the action.'''
            tools = model_tools
        else: # Default case for any other mode
            model_to_use = "mistral-large-latest"

        # Prepare messages for the API call
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": message.message})

        # Make the API call
        print(f"Making Mistral API call with model: {model_to_use}, tools: {bool(tools)}")
        chat_response = mistral_client.chat.complete(
            model=model_to_use,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None
        )
        print("Mistral API call completed.")
        print("Mistral API call successful.")

        response_message = chat_response.choices[0].message
        tools_used = []
        desktop_actions_list = [] # Initialize a list to collect all desktop actions

        # Handle tool calls
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                tools_used.append({"name": tool_name, "args": tool_args})
                current_desktop_action = None # Temporary variable for the current action

                try:
                    # Dynamically call the tool function
                    tool_function = globals().get(tool_name)
                    if tool_function and callable(tool_function):
                        result = tool_function(**tool_args)
                    else:
                        result = f"Unknown tool: {tool_name}"

                    if isinstance(result, dict) and "content" in result:
                        current_desktop_action = {"type": tool_name, "args": tool_args, "result": result["result"], "content": result["content"]}
                    else:
                        current_desktop_action = {"type": tool_name, "args": tool_args, "result": result}
                    
                    desktop_actions_list.append(current_desktop_action)
                except Exception as e:
                    desktop_actions_list.append({"type": tool_name, "args": tool_args, "error": str(e)})

        response_text = response_message.content if response_message.content is not None else ""
        if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
            response_text = response_text or "Action completed."

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

        final_response = ChatResponse(
            response=response_text,
            tools_used=tools_used, # This is a list of tool calls made by the model
            desktop_actions=desktop_actions_list if desktop_actions_list else None, # This is the list of results from executing those tools
            thinking=thinking_text
        )
        print(f"Final ChatResponse: {final_response.json()}")
        return final_response

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(response=f"Sorry, there was an error: {str(e)}")

# Vercel serverless function handler
handler = app