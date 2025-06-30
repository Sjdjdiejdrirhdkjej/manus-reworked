# manus-reworked

This project has been updated to prepare for deployment on Vercel.

## Setup

### Prerequisites

*   Node.js (LTS version recommended)
*   Python 3.9+
*   Docker and Docker Compose (optional, for containerized deployment)

### Backend Setup

1.  Navigate to the `backend/` directory:

    ```bash
    cd backend
    ```

2.  Install Python dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3.  Set your Mistral API key as an environment variable. You can create a `.env` file in the `backend/` directory:

    ```
    MISTRAL_API_KEY="your_mistral_api_key_here"
    ```

4.  Run the backend server:

    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

### MCP Server Setup

1.  Navigate to the `mcp_server/` directory:

    ```bash
    cd mcp_server
    ```

2.  Install Python dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3.  Run the MCP server:

    ```bash
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
    ```

### Frontend Setup

1.  Navigate to the `frontend/` directory:

    ```bash
    cd frontend
    ```

2.  Install Node.js dependencies:

    ```bash
    npm install
    ```

3.  Run the frontend development server:

    ```bash
    npm run dev
    ```

### Running with Docker Compose

1.  Ensure Docker and Docker Compose are installed.
2.  From the project root directory, run:

    ```bash
    docker-compose up --build
    ```

    This will build and start both the frontend and backend services.

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