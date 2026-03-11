/**
 * Automation Agent — Example
 *
 * Demonstrates an agent that reads workflow steps from a JSON config
 * and executes them sequentially, persisting progress in memory.
 */

import { Agent, type AgentConfig, type Tool } from "../agent-core/index.js";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  params: Record<string, unknown>;
  continueOnError?: boolean;
}

interface StepResult {
  stepId: string;
  stepName: string;
  status: "success" | "failed" | "skipped";
  data?: unknown;
  error?: string;
}

// ── Custom Tools ────────────────────────────────────────────────────────────

/** Tool that sends a notification (simulated). */
const notifyTool: Tool = {
  name: "notify",
  description: "Send a notification message (e.g. email, Slack, webhook).",
  parameters: [
    {
      name: "channel",
      type: "string",
      description: 'Notification channel: "email", "slack", or "webhook".',
      required: true,
    },
    {
      name: "message",
      type: "string",
      description: "The notification message.",
      required: true,
    },
  ],
  execute: async (params) => {
    const channel = params.channel as string;
    const message = params.message as string;

    // In production, integrate with real notification services.
    console.log(`  📬 [${channel.toUpperCase()}] ${message}`);
    return {
      success: true,
      data: { channel, message, sentAt: new Date().toISOString() },
    };
  },
};

/** Tool that transforms data (simulated ETL step). */
const transformDataTool: Tool = {
  name: "transformData",
  description: "Apply a simple transformation to data.",
  parameters: [
    {
      name: "input",
      type: "string",
      description: "Input data as a JSON string.",
      required: true,
    },
    {
      name: "operation",
      type: "string",
      description: 'Transformation: "uppercase", "lowercase", "reverse".',
      required: true,
    },
  ],
  execute: async (params) => {
    const input = params.input as string;
    const operation = params.operation as string;

    let output: string;
    switch (operation) {
      case "uppercase":
        output = input.toUpperCase();
        break;
      case "lowercase":
        output = input.toLowerCase();
        break;
      case "reverse":
        output = input.split("").reverse().join("");
        break;
      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }

    return { success: true, data: { input, operation, output } };
  },
};

// ── Automation Agent ────────────────────────────────────────────────────────

class AutomationAgent extends Agent {
  private readonly workflow: WorkflowStep[];

  constructor() {
    const config: AgentConfig = {
      name: "automation-agent",
      description:
        "Executes multi-step workflows with progress tracking and error recovery.",
      systemPrompt:
        "You are an automation assistant. Execute workflow steps in order, " +
        "track progress, and report results.",
      tools: [notifyTool, transformDataTool],
    };

    super(config);

    // Define a sample workflow
    this.workflow = [
      {
        id: "step-1",
        name: "Read configuration",
        tool: "readFile",
        params: { path: "package.json" },
        continueOnError: true,
      },
      {
        id: "step-2",
        name: "Transform project name",
        tool: "transformData",
        params: { input: "ai-agent-starter-kit", operation: "uppercase" },
      },
      {
        id: "step-3",
        name: "Send completion notification",
        tool: "notify",
        params: {
          channel: "slack",
          message: "Workflow completed successfully! 🚀",
        },
      },
    ];
  }

  protected override async executeTask(task: string): Promise<unknown> {
    const results: StepResult[] = [];
    const totalSteps = this.workflow.length;

    // Restore progress from memory (enables resumability)
    const completedSteps =
      this.memory.get<string[]>("workflow:completedSteps") ?? [];

    this.memory.set("workflow:task", task);
    this.memory.set("workflow:status", "running");
    this.memory.set("workflow:totalSteps", totalSteps);

    for (let i = 0; i < this.workflow.length; i++) {
      const step = this.workflow[i];

      // Skip already-completed steps (for resumability)
      if (completedSteps.includes(step.id)) {
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "skipped",
          data: "Already completed in a previous run.",
        });
        continue;
      }

      console.log(
        `\n  ⚙️  Step ${i + 1}/${totalSteps}: ${step.name}`
      );

      const toolResult = await this.callTool(step.tool, step.params);

      if (toolResult.success) {
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "success",
          data: toolResult.data,
        });

        // Track progress in memory
        completedSteps.push(step.id);
        this.memory.set("workflow:completedSteps", completedSteps);
      } else {
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "failed",
          error: toolResult.error,
        });

        if (!step.continueOnError) {
          this.memory.set("workflow:status", "failed");
          break;
        }
      }
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;

    const report = {
      task,
      totalSteps,
      succeeded,
      failed,
      skipped: results.filter((r) => r.status === "skipped").length,
      steps: results,
    };

    this.memory.set("workflow:status", failed > 0 ? "partial" : "completed");
    this.memory.set("workflow:report", report);

    return report;
  }
}

// ── Export ───────────────────────────────────────────────────────────────────

export const agent = new AutomationAgent();
export default agent;
