import type { WebStorage } from "../../infrastructure/persistence/WebStorage";

/**
 * In-memory {@link WebStorage} fake for tests, standing in for
 * `window.localStorage`. Backed by a Map so `key(index)` iterates in insertion
 * order, keeping `list()`-style enumeration deterministic.
 */
export class InMemoryWebStorage implements WebStorage {
  private readonly entries = new Map<string, string>();

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}
