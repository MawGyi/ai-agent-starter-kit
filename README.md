<div align="center">

# 🤖 AI Agent Starter Kit

### Build powerful AI agents in minutes, not months.

A production-ready TypeScript framework for creating AI agents with **persistent memory**, **tool execution**, and **automation workflows** — zero AI vendor lock-in.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Stars](https://img.shields.io/github/stars/MawGyi/ai-agent-starter-kit?style=social)](https://github.com/MawGyi/ai-agent-starter-kit)

<br />

[**Quick Start**](#-quick-start) · [**Examples**](#-example-agents) · [**Documentation**](#-architecture) · [**Contributing**](#-contributing)

<br />

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   $ npx tsx cli/run-agent.ts run examples/research-agent.ts     │
│                                                                 │
│   🤖 AI Agent Starter Kit                                       │
│   ✓ Agent loaded: research-agent                                │
│   ▶ Task: Research TypeScript best practices                    │
│                                                                 │
│   ⚡ Calling tool: httpFetch                                     │
│   ⚡ Calling tool: extractKeywords                               │
│   ⚡ Calling tool: summarize                                     │
│   ✓ Task completed successfully.                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>

---

## 🤔 Why AI Agent Starter Kit?

Most AI agent frameworks are **bloated**, **opinionated**, or **locked to a single LLM provider**. This toolkit takes a different approach:

| Problem | Our Solution |
|---------|-------------|
| 🏗️ Complex setup with dozens of dependencies | **3 core files**, zero bloat — start building in seconds |
| 🔒 Locked to OpenAI / Anthropic / etc. | **LLM-agnostic** — plug in ANY provider (or none at all) |
| 🧠 Agents forget everything between runs | **Persistent JSON memory** with namespace isolation |
| 🔧 Hard to give agents real capabilities | **Tool framework** with validation, built-in tools, and easy custom tools |
| 📦 "Hello world" agents that can't do real work | **3 production-style example agents** with multi-step workflows |

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 Persistent Memory
```typescript
// Agents remember across sessions
agent.memory.set("user_preference", "dark_mode");
agent.memory.get("user_preference"); // "dark_mode"

// Namespace isolation per agent
// Each agent gets its own memory file
```

</td>
<td width="50%">

### 🔧 Tool Framework
```typescript
// Give agents real-world capabilities
const tool: Tool = {
  name: "sendEmail",
  description: "Send an email",
  parameters: [{ name: "to", type: "string", required: true }],
  execute: async (params) => {
    // Your implementation here
    return { success: true, data: "Sent!" };
  }
};
```

</td>
</tr>
<tr>
<td width="50%">

### ⚡ CLI Runner
```bash
# Run any agent from the terminal
npx tsx cli/run-agent.ts run my-agent.ts \
  --task "Analyse the codebase" \
  --verbose

# List available tools
npx tsx cli/run-agent.ts list-tools
```

</td>
<td width="50%">

### 🎯 Event Hooks
```typescript
agent.on({
  onTaskStart:  (task) => log("Starting..."),
  onToolCall:   (name) => log(`Using ${name}`),
  onToolResult: (name, r) => log(r.success),
  onTaskComplete: (result) => log("Done!"),
});
```

</td>
</tr>
</table>

### Built-in Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| 📖 `readFile` | Read filesystem files | Config loading, code analysis |
| ✍️ `writeFile` | Write content to files | Report generation, code output |
| 🌐 `httpFetch` | HTTP/HTTPS requests | API calls, web scraping |
| 💻 `shellExec` | Execute shell commands | Build scripts, system tasks |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repo
git clone https://github.com/MawGyi/ai-agent-starter-kit.git
cd ai-agent-starter-kit

# Install dependencies
npm install
```

### Run Your First Agent

```bash
# Run the research agent
npx tsx cli/run-agent.ts run examples/research-agent.ts \
  --task "Research TypeScript best practices" --verbose

# Run the automation agent
npx tsx cli/run-agent.ts run examples/automation-agent.ts --verbose

# Run the coding agent
npx tsx cli/run-agent.ts run examples/coding-agent.ts \
  --task "Analyse code quality" --verbose
```

### Create Your First Agent (5 Lines)

```typescript
// my-agent.ts
import { Agent } from "./agent-core/index.js";

const agent = new Agent({
  name: "my-first-agent",
  description: "My custom AI agent",
  systemPrompt: "You are a helpful assistant.",
});

export default agent;
```

```bash
npx tsx cli/run-agent.ts run my-agent.ts --task "Hello world"
```

---

## 🎓 Example Agents

### 🔬 Research Agent
> Gathers information, extracts keywords, and generates summaries.

```
Fetch data → Extract keywords → Summarise findings → Store in memory → Return report
```

**Custom tools:** `summarize`, `extractKeywords`
**Demonstrates:** Multi-step reasoning, HTTP fetching, memory persistence

---

### ⚙️ Automation Agent
> Executes workflow steps sequentially with error handling and resume support.

```
Load workflow → Execute steps → Track progress → Handle errors → Send notification
```

**Custom tools:** `notify`, `transformData`
**Demonstrates:** Sequential workflows, resumability via memory, error recovery

---

### 💻 Coding Agent
> Analyses source code structure and generates TypeScript boilerplate.

```
Read source files → Analyse structure → Generate boilerplate → Compile report
```

**Custom tools:** `analyseCode`, `generateBoilerplate`
**Demonstrates:** File I/O, static analysis, code generation

---

## 🏗️ Building Custom Agents

### Level 1: Simple Agent (No Subclassing)

```typescript
import { Agent } from "./agent-core/index.js";

const agent = new Agent({
  name: "simple-agent",
  tools: [myCustomTool],
});

const result = await agent.run("Do something useful");
```

### Level 2: Custom Tools

```typescript
import { Agent, type Tool } from "./agent-core/index.js";

const weatherTool: Tool = {
  name: "getWeather",
  description: "Get current weather for a city",
  parameters: [
    { name: "city", type: "string", description: "City name", required: true },
  ],
  execute: async (params) => {
    const response = await fetch(`https://api.weather.com/${params.city}`);
    const data = await response.json();
    return { success: true, data };
  },
};

const agent = new Agent({
  name: "weather-agent",
  tools: [weatherTool],
});

export default agent;
```

### Level 3: Full Custom Agent (Subclassing)

```typescript
import { Agent, type AgentConfig } from "./agent-core/index.js";

class DataPipelineAgent extends Agent {
  constructor() {
    super({
      name: "data-pipeline",
      description: "ETL pipeline with validation and error recovery",
    });
  }

  protected override async executeTask(task: string): Promise<unknown> {
    // Step 1: Extract
    const raw = await this.callTool("readFile", { path: "data/input.csv" });

    // Step 2: Transform
    this.memory.set("pipeline:raw_count", raw.data?.length ?? 0);
    const processed = transform(raw.data);

    // Step 3: Load
    await this.callTool("writeFile", {
      path: "data/output.json",
      content: JSON.stringify(processed),
    });

    return { records: processed.length, status: "complete" };
  }
}

export default new DataPipelineAgent();
```

### Level 4: LLM Integration

```typescript
// The framework is LLM-agnostic — bring your own provider
class SmartAgent extends Agent {
  protected override async executeTask(task: string): Promise<unknown> {
    // Use OpenAI, Anthropic, Ollama, or any LLM
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: task },
      ],
      tools: this.tools.describe(), // Auto-generate tool definitions
    });

    // Execute tool calls from LLM response
    for (const toolCall of response.tool_calls) {
      await this.callTool(toolCall.name, toolCall.arguments);
    }

    return response.choices[0].message;
  }
}
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLI Runner                       │
│              cli/run-agent.ts                       │
│                                                     │
│    $ ai-agent run <file> --task "..." --verbose     │
└────────────────────────┬────────────────────────────┘
                         │  dynamic import
                         ▼
┌─────────────────────────────────────────────────────┐
│                    Agent Core                       │
│                 agent-core/                         │
│                                                     │
│  ┌─────────────┐  ┌───────────┐  ┌──────────────┐  │
│  │    Agent     │  │  Memory   │  │    Tool      │  │
│  │             │──│           │  │   Registry   │  │
│  │  • run()    │  │  • get()  │  │  • register()│  │
│  │  • callTool │  │  • set()  │  │  • invoke()  │  │
│  │  • hooks    │  │  • search │  │  • validate  │  │
│  └─────────────┘  └───────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Agent Lifecycle

```
agent.run(task)
  │
  ├── 1. 🎬 onTaskStart hook
  ├── 2. 💾 Store task in memory
  ├── 3. ⚙️  executeTask()
  │       ├── callTool() → ToolRegistry.invoke()
  │       ├── memory.set() / memory.get()
  │       └── return result
  ├── 4. 📊 Compile AgentTaskResult
  ├── 5. 🏁 onTaskComplete hook
  └── 6. ✅ Return result with full execution log
```

> 📖 **Full architecture docs:** [docs/architecture.md](docs/architecture.md)

---

## 📁 Project Structure

```
ai-agent-starter-kit/
├── agent-core/             # Core framework (the 🧠 of the toolkit)
│   ├── agent.ts            # Agent class — lifecycle, hooks, execution
│   ├── memory.ts           # Persistent JSON memory with namespaces
│   ├── tools.ts            # Tool registry + 4 built-in tools
│   └── index.ts            # Public API barrel exports
├── cli/
│   └── run-agent.ts        # CLI entry point (run / list-tools)
├── examples/
│   ├── research-agent.ts   # 🔬 Multi-step research workflow
│   ├── automation-agent.ts # ⚙️  Sequential task automation
│   └── coding-agent.ts     # 💻 Code analysis & generation
├── docs/
│   └── architecture.md     # Full system architecture docs
├── package.json
├── tsconfig.json
├── LICENSE                 # MIT
├── CONTRIBUTING.md
└── README.md
```

---

## 🛠️ Development

```bash
# Type-check (zero errors expected)
npm run typecheck

# Build to dist/
npm run build

# Run any agent in dev mode
npm run run-agent -- run examples/research-agent.ts --verbose
```

---

## 🗺️ Roadmap

- [ ] **Plugin system** — Install tools from npm packages
- [ ] **Streaming execution** — Real-time tool output streaming
- [ ] **Agent-to-agent communication** — Multi-agent orchestration
- [ ] **Web UI dashboard** — Visual agent monitoring and management
- [ ] **SQLite / Redis memory backends** — Production-grade persistence
- [ ] **LLM provider adapters** — First-class OpenAI, Anthropic, Ollama support
- [ ] **Test suite** — Comprehensive unit and integration tests
- [ ] **Agent templates** — `npx create-ai-agent` scaffolding CLI

---

## 🤝 Contributing

We love contributions! Whether it's a new tool, an example agent, or a documentation fix — every PR makes this toolkit better for everyone.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork → Clone → Branch → Code → PR
git checkout -b feature/awesome-tool
# ... make changes ...
npm run typecheck  # Ensure zero errors
# Submit PR 🚀
```

---

## 📄 License

MIT — use it, modify it, ship it. See [LICENSE](LICENSE) for details.

---

<div align="center">

### ⭐ If this project helps you build AI agents faster, give it a star!

**Built with ❤️ for the AI developer community**

[Report Bug](https://github.com/MawGyi/ai-agent-starter-kit/issues) · [Request Feature](https://github.com/MawGyi/ai-agent-starter-kit/issues) · [Discussions](https://github.com/MawGyi/ai-agent-starter-kit/discussions)

</div>
