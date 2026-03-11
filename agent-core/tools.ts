import * as fs from "node:fs";
import { exec } from "node:child_process";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Schema for a single tool parameter. */
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  description: string;
  required?: boolean;
  defaultValue?: unknown;
}

/** The result returned after a tool executes. */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * A tool that an agent can call to interact with the outside world.
 *
 * Tools are the primary way agents take actions — reading files,
 * making HTTP requests, running shell commands, etc.
 */
export interface Tool {
  /** Unique name used to invoke the tool. */
  name: string;
  /** Human-readable description of what the tool does. */
  description: string;
  /** Parameter definitions for validation and documentation. */
  parameters: ToolParameter[];
  /** The function that performs the tool's action. */
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

// ─── Tool Registry ──────────────────────────────────────────────────────────

/**
 * Registry that manages a collection of tools available to an agent.
 *
 * @example
 * ```ts
 * const registry = new ToolRegistry();
 * registry.register(readFileTool);
 * const result = await registry.invoke("readFile", { path: "./data.txt" });
 * ```
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /** Register a new tool. Throws if a tool with the same name already exists. */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    this.tools.set(tool.name, tool);
  }

  /** Remove a tool by name. Returns `true` if it existed. */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /** Retrieve a tool by name, or `undefined` if not found. */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** List all registered tools. */
  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  /** List tool names and descriptions — useful for agent prompts. */
  describe(): Array<{ name: string; description: string }> {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  /**
   * Invoke a tool by name with the given parameters.
   * Validates required parameters before execution.
   */
  async invoke(
    name: string,
    params: Record<string, unknown> = {}
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return { success: false, error: `Tool "${name}" not found.` };
    }

    // Validate required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        return {
          success: false,
          error: `Missing required parameter: "${param.name}"`,
        };
      }
    }

    // Apply default values
    const resolvedParams = { ...params };
    for (const param of tool.parameters) {
      if (!(param.name in resolvedParams) && param.defaultValue !== undefined) {
        resolvedParams[param.name] = param.defaultValue;
      }
    }

    try {
      return await tool.execute(resolvedParams);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}

// ─── Built-in Tools ─────────────────────────────────────────────────────────

/** Read a file from the filesystem and return its contents. */
export const readFileTool: Tool = {
  name: "readFile",
  description: "Read the contents of a file from the filesystem.",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Absolute or relative path to the file.",
      required: true,
    },
    {
      name: "encoding",
      type: "string",
      description: "File encoding (default: utf-8).",
      defaultValue: "utf-8",
    },
  ],
  execute: async (params) => {
    const filePath = params.path as string;
    const encoding = (params.encoding as BufferEncoding) ?? "utf-8";

    try {
      const content = fs.readFileSync(filePath, { encoding });
      return { success: true, data: content };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to read file: ${message}` };
    }
  },
};

/** Write content to a file on the filesystem. */
export const writeFileTool: Tool = {
  name: "writeFile",
  description: "Write content to a file on the filesystem.",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Absolute or relative path to the file.",
      required: true,
    },
    {
      name: "content",
      type: "string",
      description: "The content to write.",
      required: true,
    },
  ],
  execute: async (params) => {
    const filePath = params.path as string;
    const content = params.content as string;

    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true, data: `File written: ${filePath}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to write file: ${message}` };
    }
  },
};

/** Fetch data from an HTTP(S) URL. */
export const httpFetchTool: Tool = {
  name: "httpFetch",
  description: "Fetch data from an HTTP or HTTPS URL.",
  parameters: [
    {
      name: "url",
      type: "string",
      description: "The URL to fetch.",
      required: true,
    },
    {
      name: "method",
      type: "string",
      description: 'HTTP method (default: "GET").',
      defaultValue: "GET",
    },
    {
      name: "headers",
      type: "object",
      description: "Optional HTTP headers.",
    },
    {
      name: "body",
      type: "string",
      description: "Optional request body.",
    },
  ],
  execute: async (params) => {
    const url = params.url as string;
    const method = (params.method as string) ?? "GET";
    const headers = (params.headers as Record<string, string>) ?? {};
    const body = params.body as string | undefined;

    try {
      const response = await fetch(url, { method, headers, body });
      const data = await response.text();
      return {
        success: response.ok,
        data: {
          status: response.status,
          statusText: response.statusText,
          body: data,
        },
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Fetch failed: ${message}` };
    }
  },
};

/** Execute a shell command. */
export const shellExecTool: Tool = {
  name: "shellExec",
  description: "Execute a shell command and return its output.",
  parameters: [
    {
      name: "command",
      type: "string",
      description: "The shell command to execute.",
      required: true,
    },
    {
      name: "cwd",
      type: "string",
      description: "Working directory for the command.",
    },
    {
      name: "timeout",
      type: "number",
      description: "Timeout in milliseconds (default: 30000).",
      defaultValue: 30000,
    },
  ],
  execute: async (params) => {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;
    const timeout = (params.timeout as number) ?? 30000;

    return new Promise<ToolResult>((resolve) => {
      exec(command, { cwd, timeout }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            data: { stdout, stderr },
          });
        } else {
          resolve({ success: true, data: { stdout, stderr } });
        }
      });
    });
  },
};

/** All built-in tools bundled together for convenience. */
export const builtInTools: Tool[] = [
  readFileTool,
  writeFileTool,
  httpFetchTool,
  shellExecTool,
];
