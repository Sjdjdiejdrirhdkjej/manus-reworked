import os
import json
import subprocess
import shutil
import httpx
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

# --- Tool Implementations (for MCP Server) ---

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL")

async def execute_command(command: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/execute_command", json={"command": command})
        response.raise_for_status()
        return response.json().get("result", "Command executed successfully.")

async def write_file_to_mcp(path: str, content: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/write_file", json={"path": path, "content": content})
        response.raise_for_status()
        return response.json().get("message", f"File {path} written successfully.")

async def read_file_from_mcp(path: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/read_file", json={"path": path})
        response.raise_for_status()
        data = response.json()
        return {"content": data.get("content", "")}

async def list_directory_mcp(path: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/list_directory", json={"path": path})
        response.raise_for_status()
        data = response.json()
        return {"files": data.get("files", [])}

async def create_directory_mcp(path: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/create_directory", json={"path": path})
        response.raise_for_status()
        return response.json().get("message", f"Directory {path} created successfully.")

async def move_item_mcp(path: str, new_path: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/move_item", json={"path": path, "new_path": new_path})
        response.raise_for_status()
        return response.json().get("message", f"Item moved from {path} to {new_path} successfully.")

async def delete_item_mcp(path: str, is_dir: bool = False):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{MCP_SERVER_URL}/fs/delete_item", json={"path": path, "is_dir": is_dir})
        response.raise_for_status()
        return response.json().get("message", f"Item {path} deleted successfully.")


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
                    "description": "Execute a shell command via the MCP server.",
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
                    "name": "write_file_to_mcp",
                    "description": "Write content to a specified file on the MCP server.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path to the file to write to"},
                            "content": {"type": "string", "description": "The content to write into the file"}
                        },
                        "required": ["path", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file_from_mcp",
                    "description": "Read content from a specified file on the MCP server.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path to the file to read from"}
                        },
                        "required": ["path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_directory_mcp",
                    "description": "List files and directories on the MCP server.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path to the directory to list"}
                        },
                        "required": ["path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_directory_mcp",
                    "description": "Create a new directory on the MCP server.",
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
                    "name": "move_item_mcp",
                    "description": "Move or rename a file or directory on the MCP server.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path of the file or directory to move."},
                            "new_path": {"type": "string", "description": "The new path for the file or directory."}
                        },
                        "required": ["path", "new_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_item_mcp",
                    "description": "Delete a file or directory on the MCP server.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string", "description": "The path of the file or directory to delete."},
                            "is_dir": {"type": "boolean", "description": "Set to true if the item to delete is a directory."}
                        },
                        "required": ["path"]
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
                        result = await tool_function(**tool_args)
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