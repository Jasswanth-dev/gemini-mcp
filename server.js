#!/usr/bin/env node

import { spawn } from "child_process";
import readline from "readline";

// IMPORTANT: Ensure this path uses double backslashes on Windows
const PROJECT_DIR = process.env.GEMINI_PROJECT_DIR || "C:\\Users\\jassw\\Documents\\GitHub\\personalAI"; 

// Log startup info to stderr
process.stderr.write(`gemini-mcp server starting...\n`);
process.stderr.write(`PROJECT_DIR: ${PROJECT_DIR}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    const { method, params, id } = request;

    // Handle MCP Lifecycle
    if (method === "initialize") {
      process.stderr.write(`Handling initialize request (id: ${id})\n`);
      return respond(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "gemini-mcp",
          version: "1.0.0"
        }
      });
    }

    if (method === "notifications/initialized") {
      process.stderr.write(`Received initialized notification\n`);
      return; 
    }

    // Handle Tool Listing
    if (method === "tools/list") {
      process.stderr.write(`Handling tools/list request (id: ${id})\n`);
      return respond(id, {
        tools: [
          {
            name: "run_gemini",
            description: "Run Gemini CLI with a prompt",
            inputSchema: {
              type: "object",
              properties: {
                prompt: { type: "string" }
              },
              required: ["prompt"]
            }
          }
        ]
      });
    }

    // Handle Tool Calling
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      process.stderr.write(`Handling tools/call request for ${name} (id: ${id})\n`);

      if (name === "run_gemini") {
        try {
          const output = await runGemini(args.prompt);
          return respond(id, {
            content: [
              {
                type: "text",
                text: output
              }
            ]
          });
        } catch (error) {
          process.stderr.write(`Error in run_gemini: ${error.message}\n`);
          return respondError(id, -32000, error.message);
        }
      }
    }

    // Default error for unknown methods
    if (id !== undefined) {
      process.stderr.write(`Method not found: ${method} (id: ${id})\n`);
      return respondError(id, -32601, `Method not found: ${method}`);
    }

  } catch (err) {
    process.stderr.write(`Error processing message: ${err.message}\n`);
  }
});

function respond(id, result) {
  const response = JSON.stringify({
    jsonrpc: "2.0",
    id,
    result
  });
  process.stdout.write(response + "\n");
}

function respondError(id, code, message) {
  const response = JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code, message }
  });
  process.stdout.write(response + "\n");
}

function runGemini(prompt) {
  return new Promise((resolve, reject) => {
    // Escape double quotes in the prompt for the shell command
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const command = `gemini --prompt "${escapedPrompt}" --yolo --output-format text`;
    
    process.stderr.write(`Executing: ${command} in ${PROJECT_DIR}\n`);
    
    const proc = spawn(command, {
      cwd: PROJECT_DIR,
      shell: true 
    });

    let output = "";
    let error = "";

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      output += str;
      process.stderr.write(str);
    });

    proc.stderr.on("data", (data) => {
      const str = data.toString();
      error += str;
      process.stderr.write(str);
    });

    proc.on("close", (code) => {
      process.stderr.write(`Gemini process closed with code ${code}\n`);
      if (code !== 0 && !output) {
        resolve(`Gemini exited with code ${code}: ${error}`);
      } else {
        resolve(output || error);
      }
    });

    proc.on("error", (err) => {
      process.stderr.write(`Failed to start Gemini process: ${err.message}\n`);
      reject(new Error(`Failed to start Gemini CLI: ${err.message}`));
    });
  });
}
