import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single entry stored in memory. */
export interface MemoryEntry {
  key: string;
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

/** Options for constructing a Memory instance. */
export interface MemoryOptions {
  /** Directory where memory files are stored. Defaults to `.ai-agent-data` */
  storageDir?: string;
  /** Namespace to isolate memory per agent. Defaults to `"default"` */
  namespace?: string;
}

// ─── Memory Class ───────────────────────────────────────────────────────────

/**
 * Persistent JSON-backed memory for AI agents.
 *
 * Each namespace gets its own `.json` file inside the storage directory,
 * allowing multiple agents to maintain isolated state.
 *
 * @example
 * ```ts
 * const memory = new Memory({ namespace: "research" });
 * memory.set("topic", "TypeScript agents");
 * console.log(memory.get("topic")); // "TypeScript agents"
 * ```
 */
export class Memory {
  private readonly filePath: string;
  private store: Map<string, MemoryEntry>;

  constructor(options: MemoryOptions = {}) {
    const storageDir = options.storageDir ?? ".ai-agent-data";
    const namespace = options.namespace ?? "default";

    // Ensure the storage directory exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    this.filePath = path.join(storageDir, `${namespace}.json`);
    this.store = new Map();
    this.load();
  }

  // ── Read Operations ─────────────────────────────────────────────────────

  /** Retrieve a value by key. Returns `undefined` if the key does not exist. */
  get<T = unknown>(key: string): T | undefined {
    const entry = this.store.get(key);
    return entry ? (entry.value as T) : undefined;
  }

  /** Check whether a key exists in memory. */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /** Return all keys currently stored. */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /** Return all entries as an array. */
  list(): MemoryEntry[] {
    return Array.from(this.store.values());
  }

  /** Return the total number of stored entries. */
  get size(): number {
    return this.store.size;
  }

  // ── Write Operations ────────────────────────────────────────────────────

  /** Store a value under the given key. Overwrites any existing value. */
  set(key: string, value: unknown): void {
    const now = new Date().toISOString();
    const existing = this.store.get(key);

    this.store.set(key, {
      key,
      value,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    this.save();
  }

  /** Remove a single key from memory. Returns `true` if the key existed. */
  delete(key: string): boolean {
    const deleted = this.store.delete(key);
    if (deleted) this.save();
    return deleted;
  }

  /** Remove all entries from memory. */
  clear(): void {
    this.store.clear();
    this.save();
  }

  // ── Bulk Operations ─────────────────────────────────────────────────────

  /** Set multiple key-value pairs at once. */
  setMany(entries: Record<string, unknown>): void {
    const now = new Date().toISOString();

    for (const [key, value] of Object.entries(entries)) {
      const existing = this.store.get(key);
      this.store.set(key, {
        key,
        value,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    }

    this.save();
  }

  /** Search entries whose keys match the given prefix. */
  search(prefix: string): MemoryEntry[] {
    return this.list().filter((entry) => entry.key.startsWith(prefix));
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  /** Load entries from the JSON file on disk. */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const entries: MemoryEntry[] = JSON.parse(raw);
        this.store = new Map(entries.map((e) => [e.key, e]));
      }
    } catch {
      // If the file is corrupt, start fresh
      this.store = new Map();
    }
  }

  /** Persist the current state to disk as a JSON file. */
  private save(): void {
    const entries = Array.from(this.store.values());
    fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), "utf-8");
  }
}
