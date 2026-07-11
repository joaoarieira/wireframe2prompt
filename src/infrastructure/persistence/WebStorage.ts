/**
 * Minimal key/value store this project owns — the subset of the DOM `Storage`
 * API the persistence layer actually uses. `window.localStorage` satisfies it
 * structurally, and tests substitute an in-memory fake, so the repository never
 * couples to the browser global directly.
 */
export interface WebStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
