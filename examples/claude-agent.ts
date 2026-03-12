import { Agent } from "../agent-core/agent.js"

const agent = new Agent({
  name: "ClaudeAgent",
  description: "An agent that uses Claude or similar LLM models",
  systemPrompt: "You are a helpful AI agent."
})

agent.run("Explain what AI agents are and store the summary in memory")
