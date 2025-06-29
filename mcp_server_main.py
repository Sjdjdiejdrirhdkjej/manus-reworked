import os
import json
import subprocess
import shutil
from typing import Optional, List

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

# --- File System and Terminal Tool Implementations ---
# These will operate on the file system of THIS Replit project.

def _get_full_path(file_name: str) -> str:
    """Helper to get the full path within the current working directory."""
    # For Replit, we can operate directly in the project's root or a subfolder
    # For simplicity, we'll assume operations are relative to the project root
    return os.path.abspath(file_name)

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

@app.post("/write_to_file")
async def write_to_file_api(file_data: dict):
    file_name = file_data.get("file_name")
    content = file_data.get("content")
    if not file_name or content is None:
        raise HTTPException(status_code=400, detail="File name or content not provided.")
    full_path = _get_full_path(file_name)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)
        return {"result": f"Content written to {file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing to file {file_name}: {e}")

@app.post("/read_file")
async def read_file_api(file_data: dict):
    file_name = file_data.get("file_name")
    line_start = file_data.get("line_start")
    line_end = file_data.get("line_end")
    if not file_name:
        raise HTTPException(status_code=400, detail="File name not provided.")
    full_path = _get_full_path(file_name)
    try:
        with open(full_path, 'r') as f:
            lines = f.readlines()
            if line_start is not None and line_end is not None:
                content = "".join(lines[line_start - 1:line_end])
            else:
                content = "".join(lines)
        return {"result": f"Read content from {file_name}", "content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {file_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file {file_name}: {e}")

@app.post("/list_files")
async def list_files_api(path_data: dict):
    path = path_data.get("path", ".")
    full_path = _get_full_path(path)
    try:
        files = []
        for entry in os.listdir(full_path):
            entry_full_path = os.path.join(full_path, entry)
            if os.path.isdir(entry_full_path):
                files.append(entry + '/')
            else:
                files.append(entry)
        return {"result": f"Files in {path}:\n" + "\n".join(files)}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Directory not found: {path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files in {path}: {e}")

@app.post("/create_directory")
async def create_directory_api(path_data: dict):
    path = path_data.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="Path not provided.")
    full_path = _get_full_path(path)
    try:
        os.makedirs(full_path, exist_ok=True)
        return {"result": f"Directory created: {path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating directory {path}: {e}")

@app.post("/move_file_or_directory")
async def move_file_or_directory_api(paths_data: dict):
    source_path = paths_data.get("source_path")
    destination_path = paths_data.get("destination_path")
    if not source_path or not destination_path:
        raise HTTPException(status_code=400, detail="Source or destination path not provided.")
    full_source_path = _get_full_path(source_path)
    full_destination_path = _get_full_path(destination_path)
    try:
        shutil.move(full_source_path, full_destination_path)
        return {"result": f"Moved {source_path} to {destination_path}"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Source path not found: {source_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving {source_path} to {destination_path}: {e}")

@app.post("/create_file")
async def create_file_api(file_data: dict):
    file_name = file_data.get("file_name")
    if not file_name:
        raise HTTPException(status_code=400, detail="File name not provided.")
    full_path = _get_full_path(file_name)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'a') as f:
            pass
        return {"result": f"File created: {file_name}"}
    except Exception as e:
        return {"result": f"Error creating file {file_name}: {e}"}

@app.get("/")
async def root():
    return {"message": "MCP Server is running"}
