# Architecture

This document explains how the **AI Agent Starter Kit** is designed, how the components interact, and how you can extend the system.

---

## System Overview

```
                    ┌──────────────────────────┐
                    │       CLI Runner         │
                    │    cli/run-agent.ts       │
                    └────────────┬─────────────┘
                                 │
                    Dynamically imports agent file
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │         Agent            │
                    │   agent-core/agent.ts     │
                    │                          │
                    │  ┌────────┐ ┌─────────┐  │
                    │  │ Memory │ │  Tool   │  │
                    │  │        │ │Registry │  │
                    │  └───┬────┘ └────┬────┘  │
                    │      │           │       │
                    └──────┼───────────┼───────┘
                           │           │
                    ┌──────┴──┐   ┌────┴──────────┐
                    │  JSON   │   │  Built-in &   │
                    │  Files  │   │ Custom Tools  │
                    └─────────┘   └───────────────┘
```

---

## Core Components

### 1. Agent (`agent-core/agent.ts`)

The `Agent` class is the heart of the system. It encapsulates:

- **Identity** — `name`, `description`, `systemPrompt`
- **Memory** — a `Memory` instance scoped to the agent's namespace
- **Tools** — a `ToolRegistry` of callable capabilities
- **Lifecycle** — hooks for monitoring execution

#### Execution Flow

```
agent.run(task)
    │
    ├── 1. onTaskStart hook fires
    ├── 2. Task stored in memory
    ├── 3. executeTask() called
    │       ├── (Override in subclass for custom logic)
    │       ├── callTool() for each needed action
    │       └── Memory reads/writes for context
    ├── 4. Result compiled
    ├── 5. onTaskComplete hook fires
    └── 6. AgentTaskResult returned
```

#### Extending Agents

To create a custom agent, extend the `Agent` class and override `executeTask()`:

```typescript
class MyAgent extends Agent {
  protected override async executeTask(task: string): Promise<unknown> {
    // Your custom logic: LLM calls, tool orchestration, etc.
    const data = await this.callTool("readFile", { path: "config.json" });
    this.memory.set("config", data);
    return { processed: true };
  }
}
```

The base `executeTask()` provides a no-op implementation that documents available tools — meant to be overridden.

---

### 2. Memory (`agent-core/memory.ts`)

The memory system provides persistent, namespace-isolated JSON storage.

#### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **JSON files** | Zero dependencies, human-readable, easy to debug |
| **Namespace isolation** | Each agent gets its own file, preventing data collisions |
| **Synchronous I/O** | Simplicity for single-agent scenarios; swap for async in production |
| **Timestamps** | `createdAt` / `updatedAt` on every entry for auditing |

#### Storage Layout

```
.ai-agent-data/
├── default.json          # Default namespace
├── research-agent.json   # Research agent's memory
├── automation-agent.json # Automation agent's memory
└── coding-agent.json     # Coding agent's memory
```

#### Memory API

```typescript
const memory = new Memory({ namespace: "my-agent" });

// CRUD operations
memory.set("key", value);       // Create / Update
memory.get<Type>("key");        // Read
memory.delete("key");           // Delete
memory.has("key");              // Check existence

// Bulk operations
memory.setMany({ a: 1, b: 2 });
memory.search("prefix:");       // Find by key prefix

// Metadata
memory.keys();                  // All keys
memory.list();                  // All entries with timestamps
memory.size;                    // Entry count
memory.clear();                 // Reset
```

#### Swapping Storage Backends

The `Memory` class can be replaced or extended. For production use cases:

- **Redis**: Replace `load()` / `save()` with Redis client calls
- **SQLite**: Use `better-sqlite3` for structured queries
- **Cloud**: Connect to DynamoDB, Firestore, etc.

---

### 3. Tools (`agent-core/tools.ts`)

The tool system enables agents to interact with the outside world through a controlled, validated interface.

#### Tool Interface

Every tool implements:

```typescript
interface Tool {
  name: string;                              // Unique identifier
  description: string;                       // For agent prompts / docs
  parameters: ToolParameter[];               // Typed parameter definitions
  execute: (params) => Promise<ToolResult>;  // The action
}
```

#### ToolRegistry

The `ToolRegistry` manages tools and provides:

- **Registration** — `register()` / `unregister()`
- **Invocation** — `invoke()` with automatic parameter validation
- **Discovery** — `list()` and `describe()` for generating LLM prompts

#### Built-in Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `readFile` | Read filesystem files | `path`, `encoding` |
| `writeFile` | Write to files | `path`, `content` |
| `httpFetch` | HTTP requests | `url`, `method`, `headers`, `body` |
| `shellExec` | Run shell commands | `command`, `cwd`, `timeout` |

#### Creating Custom Tools

```typescript
const myTool: Tool = {
  name: "myTool",
  description: "Does something useful",
  parameters: [
    { name: "input", type: "string", description: "...", required: true },
  ],
  execute: async (params) => {
    const result = doSomething(params.input);
    return { success: true, data: result };
  },
};

agent.addTool(myTool);
```

---

## Data Flow

```
User Task (string)
      │
      ▼
   Agent.run()
      │
      ├──▶ Memory.set("currentTask", task)
      │
      ▼
   executeTask()
      │
      ├──▶ callTool("httpFetch", { url })
      │       └──▶ ToolRegistry.invoke("httpFetch", params)
      │               └──▶ Tool.execute(params) → ToolResult
      │
      ├──▶ Memory.set("results", data)
      │
      ├──▶ callTool("writeFile", { path, content })
      │
      └──▶ return result
              │
              ▼
        AgentTaskResult
        { task, status, result, log }
```

---

## CLI Architecture

The CLI (`cli/run-agent.ts`) is a thin layer that:

1. **Parses arguments** using `commander`
2. **Dynamically imports** the agent file (TypeScript, via `tsx`)
3. **Discovers the Agent** instance from exports (`default`, `agent`, or any named export)
4. **Calls `agent.run(task)`** with the provided task string
5. **Prints formatted results** to the terminal

This design means any `.ts` file that exports an `Agent` instance is runnable — no special registration needed.

---

## Design Principles

1. **Zero external AI dependency** — The core framework is LLM-agnostic. Plug in OpenAI, Anthropic, Ollama, or any provider inside `executeTask()`.
2. **Convention over configuration** — Sensible defaults everywhere; override only what you need.
3. **Composition over inheritance** — Tools and memory are composed into agents, not welded in.
4. **Human-readable state** — JSON memory files and structured logs make debugging easy.
5. **Progressive complexity** — Simple agents need 5 lines; advanced agents can override the full execution loop.
