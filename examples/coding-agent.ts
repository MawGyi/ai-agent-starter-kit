/**
 * Coding Agent — Example
 *
 * Demonstrates an agent that reads source files, analyses code structure,
 * and generates boilerplate or reports.
 */

import { Agent, type AgentConfig, type Tool } from "../agent-core/index.js";

// ── Custom Tools ────────────────────────────────────────────────────────────

/** Tool that analyses TypeScript/JavaScript code structure. */
const analyseCodeTool: Tool = {
  name: "analyseCode",
  description: "Analyse TypeScript or JavaScript code and extract structural information.",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "The source code to analyse.",
      required: true,
    },
  ],
  execute: async (params) => {
    const code = params.code as string;
    const lines = code.split("\n");

    // Basic static analysis
    const analysis = {
      totalLines: lines.length,
      blankLines: lines.filter((l) => l.trim() === "").length,
      commentLines: lines.filter((l) => {
        const t = l.trim();
        return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
      }).length,
      imports: lines.filter((l) => l.trim().startsWith("import ")).length,
      exports: lines.filter((l) => l.trim().startsWith("export ")).length,
      functions: (code.match(/\bfunction\b/g) ?? []).length,
      classes: (code.match(/\bclass\b/g) ?? []).length,
      interfaces: (code.match(/\binterface\b/g) ?? []).length,
      typeAliases: (code.match(/\btype\b\s+\w+\s*=/g) ?? []).length,
      asyncFunctions: (code.match(/\basync\b/g) ?? []).length,
    };

    return { success: true, data: analysis };
  },
};

/** Tool that generates TypeScript boilerplate code. */
const generateBoilerplateTool: Tool = {
  name: "generateBoilerplate",
  description: "Generate TypeScript boilerplate code for common patterns.",
  parameters: [
    {
      name: "pattern",
      type: "string",
      description:
        'The pattern to generate: "class", "interface", "function", "enum".',
      required: true,
    },
    {
      name: "name",
      type: "string",
      description: "The name for the generated construct.",
      required: true,
    },
    {
      name: "properties",
      type: "object",
      description:
        "Optional properties as key-value pairs of name → type.",
    },
  ],
  execute: async (params) => {
    const pattern = params.pattern as string;
    const name = params.name as string;
    const properties = (params.properties as Record<string, string>) ?? {};

    let code: string;

    switch (pattern) {
      case "class": {
        const props = Object.entries(properties)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join("\n");
        const constructorParams = Object.entries(properties)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        const assignments = Object.keys(properties)
          .map((k) => `    this.${k} = ${k};`)
          .join("\n");

        code = [
          `export class ${name} {`,
          props,
          "",
          `  constructor(${constructorParams}) {`,
          assignments,
          "  }",
          "}",
        ].join("\n");
        break;
      }

      case "interface": {
        const fields = Object.entries(properties)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join("\n");
        code = `export interface ${name} {\n${fields}\n}`;
        break;
      }

      case "function": {
        code = [
          `export function ${name}(): void {`,
          `  // TODO: implement ${name}`,
          "}",
        ].join("\n");
        break;
      }

      case "enum": {
        const members = Object.keys(properties)
          .map((k) => `  ${k} = "${k}",`)
          .join("\n");
        code = `export enum ${name} {\n${members}\n}`;
        break;
      }

      default:
        return { success: false, error: `Unknown pattern: ${pattern}` };
    }

    return { success: true, data: { code, pattern, name } };
  },
};

// ── Coding Agent ────────────────────────────────────────────────────────────

class CodingAgent extends Agent {
  constructor() {
    const config: AgentConfig = {
      name: "coding-agent",
      description:
        "Analyses code structure, generates boilerplate, and helps with code tasks.",
      systemPrompt:
        "You are a coding assistant. Analyse source code, identify patterns, " +
        "and help developers write better TypeScript.",
      tools: [analyseCodeTool, generateBoilerplateTool],
    };
    super(config);
  }

  protected override async executeTask(task: string): Promise<unknown> {
    // Step 1: Read a source file for analysis
    const readResult = await this.callTool("readFile", {
      path: "agent-core/agent.ts",
    });

    let analysis: unknown = null;

    if (readResult.success) {
      const code = readResult.data as string;

      // Step 2: Analyse the code
      const analysisResult = await this.callTool("analyseCode", { code });
      analysis = analysisResult.data;
      this.memory.set("coding:analysis", analysis);
    }

    // Step 3: Generate some boilerplate
    const boilerplateResult = await this.callTool("generateBoilerplate", {
      pattern: "interface",
      name: "TaskConfig",
      properties: {
        name: "string",
        description: "string",
        priority: "number",
        tags: "string[]",
      },
    });

    const boilerplate = boilerplateResult.success
      ? (boilerplateResult.data as { code: string }).code
      : null;

    this.memory.set("coding:generatedCode", boilerplate);

    // Step 4: Generate a class
    const classResult = await this.callTool("generateBoilerplate", {
      pattern: "class",
      name: "TaskRunner",
      properties: {
        name: "string",
        isActive: "boolean",
      },
    });

    const classCode = classResult.success
      ? (classResult.data as { code: string }).code
      : null;

    // Step 5: Compile report
    const report = {
      task,
      codeAnalysis: analysis,
      generatedBoilerplate: [
        { type: "interface", code: boilerplate },
        { type: "class", code: classCode },
      ],
      memoryKeysUsed: this.memory.keys().length,
    };

    this.memory.set("coding:report", report);

    return report;
  }
}

// ── Export ───────────────────────────────────────────────────────────────────

export const agent = new CodingAgent();
export default agent;
