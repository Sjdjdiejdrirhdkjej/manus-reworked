import os
import subprocess
import shutil
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

# --- Terminal Tool Implementation ---
# This will operate on the file system of THIS Replit project.
# NOTE: This functionality is NOT suitable for Vercel deployment and will need an alternative.

@app.post("/execute_command")
async def execute_command_api(command_data: dict):
    command = command_data.get("command")
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided.")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=True)
        return {"result": result.stdout.strip() or "Command executed successfully."}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Command failed with error: {e.stderr.strip()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing command: {e}")

# --- MCP Server File System Endpoints ---

class FileSystemItem(BaseModel):
    path: str
    is_dir: bool = False
    content: Optional[str] = None
    new_path: Optional[str] = None

@app.post("/fs/write_file")
async def write_file_api(item: FileSystemItem):
    try:
        with open(item.path, "w") as f:
            f.write(item.content)
        return {"message": f"File {item.path} written successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fs/read_file")
async def read_file_api(item: FileSystemItem):
    try:
        with open(item.path, "r") as f:
            content = f.read()
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fs/list_directory")
async def list_directory_api(item: FileSystemItem):
    try:
        files = []
        for f in os.listdir(item.path):
            full_path = os.path.join(item.path, f)
            files.append({"name": f, "is_dir": os.path.isdir(full_path)})
        return {"files": files}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Directory not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fs/create_directory")
async def create_directory_api(item: FileSystemItem):
    try:
        os.makedirs(item.path, exist_ok=True)
        return {"message": f"Directory {item.path} created successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fs/move_item")
async def move_item_api(item: FileSystemItem):
    try:
        shutil.move(item.path, item.new_path)
        return {"message": f"Item moved from {item.path} to {item.new_path} successfully."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Source item not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fs/delete_item")
async def delete_item_api(item: FileSystemItem):
    try:
        if item.is_dir:
            shutil.rmtree(item.path)
        else:
            os.remove(item.path)
        return {"message": f"Item {item.path} deleted successfully."}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Item not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "MCP Server is running with file system integration."}
