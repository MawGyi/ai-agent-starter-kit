# Contributing to AI Agent Starter Kit

Thank you for considering contributing to the AI Agent Starter Kit! We welcome contributions of all kinds — bug fixes, new tools, example agents, documentation improvements, and more.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-agent-starter-kit.git
   cd ai-agent-starter-kit
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/my-improvement
   ```

## Development Workflow

```bash
# Type-check the project
npm run typecheck

# Run an agent to test your changes
npx tsx cli/run-agent.ts run examples/research-agent.ts --verbose

# Build to verify dist output
npm run build
```

## What to Contribute

### 🔧 New Tools
Add new tools to `agent-core/tools.ts` or create standalone tool files. Each tool should:
- Implement the `Tool` interface
- Include clear parameter descriptions
- Handle errors gracefully and return `ToolResult`

### 🤖 Example Agents
Add new examples to `examples/`. Good example agents:
- Demonstrate a clear use case
- Use a mix of built-in and custom tools
- Include comments explaining the workflow

### 📚 Documentation
Improve `README.md`, `docs/architecture.md`, or add new guides.

### 🐛 Bug Fixes
Open an issue first, then submit a pull request referencing it.

## Code Standards

- **TypeScript** — All code must be typed (`strict` mode is enabled)
- **Comments** — Add JSDoc comments to all public APIs
- **Naming** — Use camelCase for variables/functions, PascalCase for classes/interfaces
- **Formatting** — Keep lines under 100 characters where possible
- **Error handling** — Always return `ToolResult` objects; never throw from tool `execute` functions

## Pull Request Process

1. Ensure `npm run typecheck` passes with zero errors
2. Update documentation if your change affects public APIs
3. Add or update example agents if applicable
4. Write a clear PR description explaining **what** and **why**
5. Reference any related issues

## Code of Conduct

Be respectful and constructive. We're all here to build great developer tools.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
