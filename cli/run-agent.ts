#!/usr/bin/env npx tsx

/**
 * ai-agent CLI — Run agents from the terminal.
 *
 * Usage:
 *   npx ai-agent run <file> [--task "..."]
 *   npx ai-agent list-tools
 */

import { Command } from "commander";
import * as path from "node:path";
import * as fs from "node:fs";
import { Agent, ToolRegistry, builtInTools } from "../agent-core/index.js";

// ── Colour Helpers (no dependencies) ────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

function banner(): void {
  console.log(`
${c.cyan}${c.bold}┌──────────────────────────────────────────┐
│       🤖  AI Agent Starter Kit  🤖       │
│         CLI Runner v1.0.0                │
└──────────────────────────────────────────┘${c.reset}
`);
}

// ── CLI Program ─────────────────────────────────────────────────────────────

const program = new Command();

program
  .name("ai-agent")
  .description("Run AI agents from the terminal")
  .version("1.0.0");

// ── run command ─────────────────────────────────────────────────────────────

program
  .command("run")
  .description("Run an agent from a TypeScript file")
  .argument("<file>", "Path to the agent file (.ts)")
  .option("-t, --task <task>", "The task to give the agent")
  .option("-v, --verbose", "Show detailed execution logs", false)
  .action(async (file: string, options: { task?: string; verbose?: boolean }) => {
    banner();

    const resolvedPath = path.resolve(file);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`${c.red}✗ File not found: ${resolvedPath}${c.reset}`);
      process.exit(1);
    }

    console.log(`${c.dim}Loading agent from:${c.reset} ${c.cyan}${resolvedPath}${c.reset}`);

    try {
      // Dynamically import the agent file
      const agentModule = await import(resolvedPath);

      // Look for an exported Agent instance or a default export
      let agent: Agent | undefined;

      if (agentModule.default instanceof Agent) {
        agent = agentModule.default;
      } else if (agentModule.agent instanceof Agent) {
        agent = agentModule.agent;
      } else {
        // Search all exports for an Agent instance
        for (const key of Object.keys(agentModule)) {
          if (agentModule[key] instanceof Agent) {
            agent = agentModule[key];
            break;
          }
        }
      }

      if (!agent) {
        console.error(
          `${c.red}✗ No Agent instance found in ${file}.${c.reset}\n` +
          `${c.dim}  Export an Agent as default, named "agent", or any named export.${c.reset}`
        );
        process.exit(1);
      }

      const task =
        options.task ??
        `Default task for ${agent.name}: execute your primary function.`;

      console.log(`${c.green}✓${c.reset} Agent loaded: ${c.bold}${agent.name}${c.reset}`);
      if (agent.description) {
        console.log(`  ${c.dim}${agent.description}${c.reset}`);
      }
      console.log(`${c.dim}──────────────────────────────────────────${c.reset}`);
      console.log(`${c.magenta}▶ Task:${c.reset} ${task}`);
      console.log();

      // Attach verbose logging hook
      if (options.verbose) {
        agent.on({
          onLog: (entry) => {
            const icon =
              entry.type === "error" ? `${c.red}✗` :
              entry.type === "tool_call" ? `${c.yellow}⚡` :
              entry.type === "tool_result" ? `${c.blue}←` :
              entry.type === "complete" ? `${c.green}✓` :
              `${c.dim}ℹ`;
            console.log(`  ${icon} ${entry.message}${c.reset}`);
          },
        });
      }

      // Run the agent
      const result = await agent.run(task);

      console.log(`${c.dim}──────────────────────────────────────────${c.reset}`);

      if (result.status === "completed") {
        console.log(`${c.green}${c.bold}✓ Task completed successfully.${c.reset}`);
        if (result.result) {
          console.log();
          console.log(`${c.cyan}Result:${c.reset}`);
          console.log(JSON.stringify(result.result, null, 2));
        }
      } else {
        console.log(`${c.red}${c.bold}✗ Task failed.${c.reset}`);
        const errors = result.log.filter((e) => e.type === "error");
        for (const err of errors) {
          console.error(`  ${c.red}${err.message}${c.reset}`);
        }
      }

      console.log();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${c.red}✗ Failed to load agent: ${message}${c.reset}`);
      process.exit(1);
    }
  });

// ── list-tools command ──────────────────────────────────────────────────────

program
  .command("list-tools")
  .description("List all built-in tools available to agents")
  .action(() => {
    banner();
    console.log(`${c.bold}Built-in Tools:${c.reset}\n`);

    const registry = new ToolRegistry();
    for (const tool of builtInTools) {
      registry.register(tool);
    }

    for (const tool of registry.list()) {
      console.log(`  ${c.cyan}${c.bold}${tool.name}${c.reset}`);
      console.log(`  ${c.dim}${tool.description}${c.reset}`);

      if (tool.parameters.length > 0) {
        console.log(`  ${c.yellow}Parameters:${c.reset}`);
        for (const param of tool.parameters) {
          const req = param.required ? `${c.red}*${c.reset}` : "";
          console.log(`    ${req}${c.bold}${param.name}${c.reset} (${param.type}) — ${param.description}`);
        }
      }
      console.log();
    }
  });

// ── Parse & Execute ─────────────────────────────────────────────────────────

program.parse();
