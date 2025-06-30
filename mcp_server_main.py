import uvicorn
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the MCP Server.")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host address to bind to.")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on.")
    args = parser.parse_args()

    uvicorn.run("mcp_server.app:app", host=args.host, port=args.port, reload=True)