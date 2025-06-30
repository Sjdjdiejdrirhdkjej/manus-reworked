import os
import httpx
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for your frontend (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.replit.dev",
        "https://*.replit.app",
        "https://*.vercel.app",
        "https://vercel.app",
        "*" # Be cautious with "*" in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CODESANDBOX_PROXY_URL = os.getenv("MCP_SERVER_URL", "http://codesandbox_proxy:3001")

async def call_codesandbox_proxy(endpoint: str, payload: dict):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{CODESANDBOX_PROXY_URL}{endpoint}", json=payload)
            response.raise_for_status()  # Raise an exception for 4xx/5xx responses
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Proxy request failed: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Proxy returned error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

# --- Terminal Tool Implementation ---

@app.post("/execute_command")
async def execute_command_api(command_data: dict):
    command = command_data.get("command")
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided.")
    return await call_codesandbox_proxy("/execute_command", {"command": command})

# --- MCP Server File System Endpoints ---

class FileSystemItem(BaseModel):
    path: str
    is_dir: Optional[bool] = False
    content: Optional[str] = None
    new_path: Optional[str] = None

@app.post("/fs/write_file")
async def write_file_api(item: FileSystemItem):
    return await call_codesandbox_proxy("/fs/write_file", {"path": item.path, "content": item.content})

@app.post("/fs/read_file")
async def read_file_api(item: FileSystemItem):
    return await call_codesandbox_proxy("/fs/read_file", {"path": item.path})

@app.post("/fs/list_directory")
async def list_directory_api(item: FileSystemItem):
    return await call_codesandbox_proxy("/fs/list_directory", {"path": item.path})

@app.post("/fs/create_directory")
async def create_directory_api(item: FileSystemItem):
    # CodeSandbox SDK doesn't have a direct create_directory. Use vm.run with mkdir.
    command = f"mkdir -p {item.path}"
    return await call_codesandbox_proxy("/execute_command", {"command": command})

@app.post("/fs/move_item")
async def move_item_api(item: FileSystemItem):
    # CodeSandbox SDK doesn't have a direct move_item. Use vm.run with mv.
    if not item.new_path:
        raise HTTPException(status_code=400, detail="new_path is required for move_item.")
    command = f"mv {item.path} {item.new_path}"
    return await call_codesandbox_proxy("/execute_command", {"command": command})

@app.post("/fs/delete_item")
async def delete_item_api(item: FileSystemItem):
    # CodeSandbox SDK doesn't have a direct delete_item. Use vm.run with rm.
    # Be careful with recursive delete (rm -rf) if is_dir is true.
    command = f"rm -{'rf' if item.is_dir else 'f'} {item.path}"
    return await call_codesandbox_proxy("/execute_command", {"command": command})

@app.get("/")
async def root():
    return {"message": "MCP Server is running, proxied to CodeSandbox VM."}
