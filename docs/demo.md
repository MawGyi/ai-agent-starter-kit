# CLI Demo Output

Here is what the command-line interface output looks like when running an example agent:

```bash
$ npx ts-node cli/run-agent.ts examples/chat-agent.ts

[ChatAgent] Received task: "Explain what AI agents are and store the answer in memory."
[ChatAgent] Thinking...
[ChatAgent] Saving response to memory...
[ChatAgent] Retrieving memory to verify...
[ChatAgent] Memory contents: [
  {
    id: '1678536832101-qweasd123',
    content: 'AI agents are autonomous software entities that perceive their environment and take actions to achieve specific goals.',
    metadata: {
      task: 'Explain what AI agents are and store the answer in memory.'
    },
    timestamp: 1678536832101
  }
]
[ChatAgent] Task completed successfully.
```
