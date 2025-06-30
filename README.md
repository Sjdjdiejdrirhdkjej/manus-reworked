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
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
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

3.  Create a `.env.local` file in the `frontend/` directory and set the API URL:

    ```
    NEXT_PUBLIC_API_URL=http://localhost:8001
    ```

4.  Run the frontend development server:

    ```bash
    npm run dev
    ```

### Remote CodeSandbox Proxy Configuration

If your CodeSandbox proxy is running on a different machine or a different URL, you need to configure the backend to point to it.

#### Backend Configuration

Set the `MCP_SERVER_URL` environment variable in the `backend/.env` file to the URL of your remote CodeSandbox proxy:

```
MCP_SERVER_URL="http://your_remote_codesandbox_proxy_ip:3001"
```

### Running with Docker Compose

1.  Ensure Docker and Docker Compose are installed.
2.  From the project root directory, run:

    ```bash
    docker-compose up --build
    ```

    This will build and start both the frontend and backend services.

## Backend Changes

The previous `mcp_server` has been replaced by a Node.js-based `codesandbox_proxy` service that leverages the CodeSandbox SDK. All file system operations and shell command executions are now proxied through this service to a CodeSandbox VM.

### File Storage and Terminal Shell Execution

File system operations (read, write, list, create directory, move, and delete files/directories) and terminal shell execution are now handled by the `codesandbox_proxy` service, which interacts with a CodeSandbox VM. This provides a more isolated and potentially more scalable solution for these functionalities.

## Frontend Changes

Your frontend application (in `frontend/`) will need to be updated to call the new MCP server-backed endpoints on the backend.