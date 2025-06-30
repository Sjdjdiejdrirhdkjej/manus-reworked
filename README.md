# manus-reworked

This project has been updated to prepare for deployment on Vercel.

## Backend Changes (`mcp_server_main.py`)

The local file system operations (read, write, list, create, move files/directories) have been removed from `mcp_server_main.py`. These functionalities are not suitable for Vercel's serverless environment, which does not provide a persistent, writable file system.

### File Storage

**MCP server integration for file storage is now implemented in `mcp_server_main.py`**. This includes endpoints for writing, reading, listing, creating directories, moving, and deleting files/directories on the MCP server.

### Terminal Shell Execution

The `execute_command` endpoint remains in `mcp_server_main.py` for now, but it is **not suitable for Vercel deployment**. Vercel functions are short-lived and stateless, and cannot execute arbitrary shell commands in a persistent manner. You will need to find an alternative solution for terminal shell execution, such as:
*   A dedicated compute instance (e.g., AWS EC2, Google Compute Engine, DigitalOcean Droplet).
*   A managed container service (e.g., AWS Fargate, Google Cloud Run).

## Frontend Changes

Your frontend application (in `frontend/`) will need to be updated to call the new MCP server-backed endpoints on the backend.