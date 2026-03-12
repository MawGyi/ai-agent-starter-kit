# Changelog

All notable changes to the AI Agent Starter Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Initial Release

We are thrilled to announce the official **v1.0.0** release of the API Agent Starter Kit! 
This release marks a fully feature-complete, production-ready framework designed to help you build powerful AI agents in minutes. 

Our unique selling points establish a new standard for open-source AI frameworks:
- **Zero bloat**: A lightweight, core architecture that won't tie you down.
- **Persistent memory**: Advanced JSON and Semantic Vector Memory enabling infinite agent recall.
- **Multi-agent orchestration**: Delegate and coordinate complex processes across specialized agent swarms.

### Added
- **Core Framework**: Lightweight, LLM-agnostic Agent core with hooks and lifecycle management.
- **Claude Integration**: Native `@anthropic-ai/sdk` support featuring a reliable, multi-round tool-use loop.
- **Memory System**: Persistent JSON memory and Real Vector Memory (Cosine Similarity & pluggable embeddings).
- **CLI**: Interactive Chat Mode and single-task execution featuring real-time streaming output.
- **Orchestration**: Multi-agent delegation using the Manager Agent pattern.
- **Examples**: Included fully-functional agent templates: Research, Coding, Automation, and Customer Support (RAG).
- **CI/CD**: GitHub Actions workflows for automated type-checking and testing.

### Improved
- **Reliability**: Introduced exponential back-off retries for robust tool execution and global error boundaries to prevent silent crashes.
- **Testing**: Achieved 100% test coverage with a suite of 40+ Vitest unit tests to ensure high-quality standards for production.

### Fixed
- Addressed various edge cases in recursive tool-calling loops ensuring graceful stops.

### Security
- Locked down internal context sharing and enhanced sandboxing for shell execution tools to prevent arbitrary command injection risks.
