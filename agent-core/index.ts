/**
 * ai-agent-starter-kit — Agent Core
 *
 * Re-exports all public APIs from the core modules so consumers can
 * import everything from a single entry point:
 *
 * ```ts
 * import { Agent, Memory, ToolRegistry } from "./agent-core/index.js";
 * ```
 */

// ── Agent ───────────────────────────────────────────────────────────────────
export { Agent } from "./agent.js";
export type {
  AgentConfig,
  AgentLogEntry,
  AgentTaskResult,
  AgentHooks,
} from "./agent.js";

// ── Memory ──────────────────────────────────────────────────────────────────
export { Memory } from "./memory.js";
export type { MemoryEntry, MemoryOptions } from "./memory.js";

// ── Tools ───────────────────────────────────────────────────────────────────
export { ToolRegistry, builtInTools } from "./tools.js";
export { readFileTool, writeFileTool, httpFetchTool, shellExecTool } from "./tools.js";
export type { Tool, ToolParameter, ToolResult } from "./tools.js";
