import { SimpleVectorMemory } from '../agent-core/vectorMemory.js';

class Agent {
  private memory: SimpleVectorMemory;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.memory = new SimpleVectorMemory();
  }

  async run(task: string) {
    console.log(`[${this.name}] Received task: "${task}"`);
    console.log(`[${this.name}] Thinking...`);

    // Simulate Agent behavior
    const response = "AI agents are autonomous software entities that perceive their environment and take actions to achieve specific goals.";
    
    console.log(`[${this.name}] Saving response to memory...`);
    await this.memory.saveMemory(response, { task });

    console.log(`[${this.name}] Retrieving memory to verify...`);
    const memories = await this.memory.listMemories();
    console.log(`[${this.name}] Memory contents:`, memories);
    
    console.log(`[${this.name}] Task completed successfully.`);
  }
}

async function main() {
  const agent = new Agent("ChatAgent");
  await agent.run("Explain what AI agents are and store the answer in memory.");
}

if (require.main === module) {
  main().catch(console.error);
}
