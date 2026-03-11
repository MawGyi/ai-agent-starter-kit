import { Memory } from "./memory.js";
import { ToolRegistry, builtInTools, type Tool, type ToolResult } from "./tools.js";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Configuration for creating a new Agent instance. */
export interface AgentConfig {
  /** A unique name identifying this agent. */
  name: string;
  /** A short description of what this agent does. */
  description?: string;
  /** System prompt that defines the agent's behaviour and role. */
  systemPrompt?: string;
  /** Custom tools the agent should have access to. */
  tools?: Tool[];
  /** Whether to include built-in tools (readFile, writeFile, etc.). Default: true */
  includeBuiltInTools?: boolean;
  /** Options for the agent's memory system. */
  memoryOptions?: {
    storageDir?: string;
    namespace?: string;
  };
}

/** Log entry generated during agent execution. */
export interface AgentLogEntry {
  timestamp: string;
  type: "info" | "tool_call" | "tool_result" | "error" | "complete";
  message: string;
  data?: unknown;
}

/** The final result of an agent's task execution. */
export interface AgentTaskResult {
  task: string;
  status: "completed" | "failed";
  result?: unknown;
  log: AgentLogEntry[];
  startedAt: string;
  completedAt: string;
}

/** Event hooks for monitoring agent execution. */
export interface AgentHooks {
  onTaskStart?: (task: string) => void | Promise<void>;
  onToolCall?: (toolName: string, params: Record<string, unknown>) => void | Promise<void>;
  onToolResult?: (toolName: string, result: ToolResult) => void | Promise<void>;
  onLog?: (entry: AgentLogEntry) => void | Promise<void>;
  onTaskComplete?: (result: AgentTaskResult) => void | Promise<void>;
}

// ─── Agent Class ────────────────────────────────────────────────────────────

/**
 * Core Agent class — the heart of the ai-agent-starter-kit.
 *
 * An agent receives a task, reasons about it, invokes tools as needed,
 * stores context in memory, and returns a result.
 *
 * @example
 * ```ts
 * import { Agent } from "./agent-core/index.js";
 *
 * const agent = new Agent({
 *   name: "researcher",
 *   description: "Gathers and summarises information",
 *   systemPrompt: "You are a research assistant.",
 * });
 *
 * const result = await agent.run("Summarise the key features of TypeScript 5.5");
 * console.log(result);
 * ```
 */
export class Agent {
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly memory: Memory;
  readonly tools: ToolRegistry;

  private hooks: AgentHooks = {};
  private log: AgentLogEntry[] = [];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.description = config.description ?? "";
    this.systemPrompt = config.systemPrompt ?? "You are a helpful AI agent.";

    // Initialise memory with the agent's name as the default namespace
    this.memory = new Memory({
      storageDir: config.memoryOptions?.storageDir,
      namespace: config.memoryOptions?.namespace ?? config.name,
    });

    // Initialise the tool registry
    this.tools = new ToolRegistry();

    // Register built-in tools unless explicitly disabled
    if (config.includeBuiltInTools !== false) {
      for (const tool of builtInTools) {
        this.tools.register(tool);
      }
    }

    // Register any custom tools
    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.register(tool);
      }
    }
  }

  // ── Configuration Helpers ───────────────────────────────────────────────

  /** Register event hooks for monitoring execution. */
  on(hooks: AgentHooks): this {
    this.hooks = { ...this.hooks, ...hooks };
    return this;
  }

  /** Add a tool to the agent's registry. */
  addTool(tool: Tool): this {
    this.tools.register(tool);
    return this;
  }

  /** Remove a tool from the agent's registry by name. */
  removeTool(name: string): this {
    this.tools.unregister(name);
    return this;
  }

  // ── Execution ─────────────────────────────────────────────────────────

  /**
   * Execute a task. This is the primary entry point for running an agent.
   *
   * The default implementation provides a straightforward execute-and-report
   * loop. Override `executeTask` in subclasses for custom behaviour (e.g.
   * multi-step reasoning, LLM integration, chain-of-thought).
   */
  async run(task: string): Promise<AgentTaskResult> {
    const startedAt = new Date().toISOString();
    this.log = [];

    this.addLog("info", `Agent "${this.name}" starting task.`);
    this.addLog("info", `Task: ${task}`);
    await this.hooks.onTaskStart?.(task);

    try {
      // Store the task in memory for context
      this.memory.set("currentTask", task);
      this.memory.set("taskHistory", [
        ...((this.memory.get<string[]>("taskHistory") ?? [])),
        { task, startedAt },
      ]);

      // Delegate to the implementable method
      const result = await this.executeTask(task);

      const taskResult: AgentTaskResult = {
        task,
        status: "completed",
        result,
        log: this.log,
        startedAt,
        completedAt: new Date().toISOString(),
      };

      this.addLog("complete", "Task completed successfully.");
      await this.hooks.onTaskComplete?.(taskResult);

      return taskResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.addLog("error", `Task failed: ${message}`);

      const taskResult: AgentTaskResult = {
        task,
        status: "failed",
        log: this.log,
        startedAt,
        completedAt: new Date().toISOString(),
      };

      await this.hooks.onTaskComplete?.(taskResult);
      return taskResult;
    }
  }

  /**
   * Override this method to implement custom task execution logic.
   *
   * The base implementation demonstrates a simple tool-calling pattern.
   * Real-world agents should integrate an LLM here to reason about which
   * tools to call and how to compose the final answer.
   */
  protected async executeTask(task: string): Promise<unknown> {
    this.addLog("info", "Processing task with available tools...");
    this.addLog("info", `Available tools: ${this.tools.list().map((t) => t.name).join(", ")}`);

    // Store the task as the result — subclasses should override this
    // with actual LLM reasoning and tool invocation logic.
    const result = {
      agent: this.name,
      task,
      systemPrompt: this.systemPrompt,
      availableTools: this.tools.describe(),
      memoryKeys: this.memory.keys(),
      message:
        "This is the base agent implementation. " +
        "Extend the Agent class and override executeTask() " +
        "to add LLM reasoning, tool calling, and custom logic.",
    };

    return result;
  }

  // ── Tool Invocation Helpers ─────────────────────────────────────────────

  /**
   * Call a tool by name and record it in the execution log.
   * Agents can use this method inside `executeTask` for easy tool access.
   */
  protected async callTool(
    name: string,
    params: Record<string, unknown> = {}
  ): Promise<ToolResult> {
    this.addLog("tool_call", `Calling tool: ${name}`, params);
    await this.hooks.onToolCall?.(name, params);

    const result = await this.tools.invoke(name, params);

    this.addLog("tool_result", `Tool "${name}" result: ${result.success ? "success" : "failed"}`, result);
    await this.hooks.onToolResult?.(name, result);

    // Store the result in memory for context
    this.memory.set(`lastToolCall`, { tool: name, params, result });

    return result;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private addLog(
    type: AgentLogEntry["type"],
    message: string,
    data?: unknown
  ): void {
    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    this.log.push(entry);
    this.hooks.onLog?.(entry);
  }
}
