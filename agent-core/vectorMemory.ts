/**
 * Simple Vector Memory Adapter Interface
 * Provides mechanisms for storing and retrieving semantic memory.
 */

export interface VectorMemoryMemory {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface VectorMemoryAdapter {
  /**
   * Saves a new memory to the vector store.
   * @param content The text content of the memory.
   * @param metadata Optional metadata associated with the memory.
   * @returns The generated memory ID.
   */
  saveMemory(content: string, metadata?: Record<string, any>): Promise<string>;

  /**
   * Searches for relevant memories based on a query string.
   * @param query The search query.
   * @param limit Maximum number of relevant memories to return.
   * @returns Array of retrieved memory objects.
   */
  searchMemory(query: string, limit?: number): Promise<VectorMemoryMemory[]>;

  /**
   * Lists all stored memories, optionally with pagination.
   * @returns Array of all available memories.
   */
  listMemories(): Promise<VectorMemoryMemory[]>;
}

export class SimpleVectorMemory implements VectorMemoryAdapter {
  private memories: Map<string, VectorMemoryMemory> = new Map();

  async saveMemory(content: string, metadata?: Record<string, any>): Promise<string> {
    const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
    const newMemory: VectorMemoryMemory = {
      id,
      content,
      metadata,
      timestamp: Date.now(),
    };
    this.memories.set(id, newMemory);
    return id;
  }

  async searchMemory(query: string, limit: number = 5): Promise<VectorMemoryMemory[]> {
    // In a real implementation, this would compute vector embeddings and perform cosine similarity search.
    // For this simple mock, we simulate retrieval logic.
    const allMemories = Array.from(this.memories.values());
    const queryLower = query.toLowerCase();
    
    // Simple fallback string match simulation
    const matched = allMemories.filter(mem => mem.content.toLowerCase().includes(queryLower));
    return matched.slice(0, limit);
  }

  async listMemories(): Promise<VectorMemoryMemory[]> {
    return Array.from(this.memories.values());
  }
}
