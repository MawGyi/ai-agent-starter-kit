/**
 * Research Agent — Example
 *
 * Demonstrates an agent that gathers information from URLs,
 * stores findings in memory, and produces a summary.
 */

import { Agent, type AgentConfig, type Tool } from "../agent-core/index.js";

// ── Custom Tools ────────────────────────────────────────────────────────────

/** Tool that simulates summarising a block of text. */
const summarizeTool: Tool = {
  name: "summarize",
  description: "Summarise a block of text into key bullet points.",
  parameters: [
    {
      name: "text",
      type: "string",
      description: "The text to summarise.",
      required: true,
    },
    {
      name: "maxPoints",
      type: "number",
      description: "Maximum number of bullet points (default: 5).",
      defaultValue: 5,
    },
  ],
  execute: async (params) => {
    const text = params.text as string;
    const maxPoints = (params.maxPoints as number) ?? 5;

    // In production, this would call an LLM API.
    // Here we demonstrate the tool pattern with a simple extraction.
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const points = sentences.slice(0, maxPoints).map((s) => `• ${s}`);

    return {
      success: true,
      data: {
        summary: points.join("\n"),
        pointCount: points.length,
      },
    };
  },
};

/** Tool that extracts keywords from text. */
const extractKeywordsTool: Tool = {
  name: "extractKeywords",
  description: "Extract important keywords from a block of text.",
  parameters: [
    {
      name: "text",
      type: "string",
      description: "The text to analyse.",
      required: true,
    },
  ],
  execute: async (params) => {
    const text = params.text as string;

    // Simple keyword extraction: find capitalised words and common nouns
    const words = text.split(/\s+/).filter((w) => w.length > 4);
    const frequency = new Map<string, number>();

    for (const word of words) {
      const normalised = word.toLowerCase().replace(/[^a-z]/g, "");
      if (normalised.length > 4) {
        frequency.set(normalised, (frequency.get(normalised) ?? 0) + 1);
      }
    }

    const keywords = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return { success: true, data: { keywords } };
  },
};

// ── Research Agent ──────────────────────────────────────────────────────────

class ResearchAgent extends Agent {
  constructor() {
    const config: AgentConfig = {
      name: "research-agent",
      description:
        "Gathers information from sources, extracts keywords, and produces summaries.",
      systemPrompt:
        "You are a research assistant. Your goal is to gather information, " +
        "identify key themes, and produce clear, concise summaries.",
      tools: [summarizeTool, extractKeywordsTool],
    };
    super(config);
  }

  /** Run a multi-step research workflow. */
  protected override async executeTask(task: string): Promise<unknown> {
    // Step 1: Record the research task
    this.memory.set("research:task", task);

    // Step 2: Fetch data (using the built-in httpFetch tool)
    const fetchResult = await this.callTool("httpFetch", {
      url: "https://jsonplaceholder.typicode.com/posts/1",
    });

    let sourceText =
      "TypeScript is a strongly typed programming language that builds on " +
      "JavaScript. It adds optional static typing, classes, and interfaces. " +
      "TypeScript is designed for development of large applications and " +
      "transpiles to JavaScript. It is a superset of JavaScript with " +
      "additional capabilities. TypeScript supports object-oriented " +
      "programming features like classes, interfaces, and inheritance. " +
      "The language was developed by Microsoft and is open source.";

    if (fetchResult.success && fetchResult.data) {
      const body = (fetchResult.data as { body?: string }).body;
      if (body) {
        try {
          const parsed = JSON.parse(body);
          sourceText = parsed.body ?? sourceText;
        } catch {
          // Use default text
        }
      }
    }

    this.memory.set("research:sourceText", sourceText);

    // Step 3: Extract keywords
    const keywordsResult = await this.callTool("extractKeywords", {
      text: sourceText,
    });

    const keywords = keywordsResult.success
      ? (keywordsResult.data as { keywords: string[] }).keywords
      : [];

    this.memory.set("research:keywords", keywords);

    // Step 4: Summarise
    const summaryResult = await this.callTool("summarize", {
      text: sourceText,
      maxPoints: 5,
    });

    const summary = summaryResult.success
      ? (summaryResult.data as { summary: string }).summary
      : "Unable to generate summary.";

    this.memory.set("research:summary", summary);

    // Step 5: Compile final report
    const report = {
      task,
      keywords,
      summary,
      sourcesChecked: 1,
      memoryKeysUsed: this.memory.keys().length,
    };

    this.memory.set("research:report", report);

    return report;
  }
}

// ── Export ───────────────────────────────────────────────────────────────────

export const agent = new ResearchAgent();
export default agent;
