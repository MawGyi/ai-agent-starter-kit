# Integrations

The AI Agent Starter Kit is designed to be completely LLM-agnostic, allowing you to connect various AI models for reasoning and tool execution.

## Claude
You can easily integrate Anthropic's Claude API by initializing the official Anthropic client and delegating the task execution to Claude's tool calling API.

## OpenAI
OpenAI APIs (like GPT-4 and GPT-3.5) are fully supported. Simply bring your `openai` package dependency and pass the agent's tools descriptor.

## Local models
For offline workflows, you can connect the framework to local LLM systems like Ollama, Llama.cpp, or LM Studio, ensuring data privacy and zero API costs.
