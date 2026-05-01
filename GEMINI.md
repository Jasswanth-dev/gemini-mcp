# gemini-mcp

A Model Context Protocol (MCP) server that provides a bridge to the Gemini CLI, allowing other MCP-compatible clients (like Claude Desktop) to execute Gemini commands.

## Project Overview

- **Type:** Node.js MCP Server
- **Main Entry Point:** `server.js`
- **Core Technology:** JavaScript (ES Modules), Node.js `child_process` (spawn), `readline`.
- **Primary Tool:** `run_gemini` - Executes `gemini --prompt <prompt> --yolo` in a specified directory.

## Architecture

The server communicates via standard I/O (stdin/stdout) using the JSON-RPC 2.0 based Model Context Protocol. 

### MCP Lifecycle Support:
1.  **Initialize:** Responds to `initialize` requests with protocol version and tool capabilities.
2.  **Tool Listing:** Provides tool definitions via `tools/list`.
3.  **Tool Execution:** Handles `tools/call` for the `run_gemini` tool.

## Building and Running

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [Gemini CLI](https://github.com/google/gemini-cli) installed and configured in your PATH.

### Installation
```bash
npm install
```

### Running Locally
You can run the server directly using Node:
```bash
node server.js
```

### Configuration for Claude Desktop
Add the following to your Claude Desktop configuration file (usually `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["C:\\path\\to\\gemini-mcp\\server.js"],
      "env": {
        "GEMINI_PROJECT_DIR": "C:\\path\\to\\your\\project"
      }
    }
  }
}
```

**Note:** The server supports the `GEMINI_PROJECT_DIR` environment variable to specify the target directory. If not provided, it defaults to a pre-configured path in `server.js`.

## Development Conventions

- **JSON-RPC 2.0:** All messages must include `jsonrpc: "2.0"` and match request IDs.
- **Stdout/Stderr:** ONLY valid JSON-RPC messages should be written to `stdout`. Use `stderr` for logging and debugging to avoid breaking the MCP connection.
- **Windows Compatibility:** Uses `shell: true` in `spawn` and double backslashes in paths.

## Key Files

- `server.js`: The main server logic, implementing the MCP handshake and tool dispatching.
- `package.json`: Project metadata and dependencies.
- `GEMINI.md`: This instruction file.
