import type { WireframeDocument } from "../aggregates/wireframe-document/WireframeDocument";

export interface DocumentSummary {
  id: string;
  name: string;
  /** Epoch milliseconds of the last edit; 0 for legacy docs never re-saved. */
  lastEdit: number;
}

/**
 * Persistence port. The initial implementation is LocalStorage-backed; IndexedDB
 * can replace it later without touching the use cases.
 */
export interface IDocumentRepository {
  save(doc: WireframeDocument): Promise<void>;
  load(id: string): Promise<WireframeDocument | null>;
  /** Summaries ordered most-recently-edited first (descending `lastEdit`). */
  list(): Promise<DocumentSummary[]>;
  delete(id: string): Promise<void>;
}
