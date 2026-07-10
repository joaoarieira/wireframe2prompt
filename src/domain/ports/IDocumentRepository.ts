import type { WireframeDocument } from "../aggregates/wireframe-document/WireframeDocument";

export interface DocumentSummary {
  id: string;
  name: string;
}

/**
 * Persistence port. The initial implementation is LocalStorage-backed; IndexedDB
 * can replace it later without touching the use cases.
 */
export interface IDocumentRepository {
  save(doc: WireframeDocument): Promise<void>;
  load(id: string): Promise<WireframeDocument | null>;
  list(): Promise<DocumentSummary[]>;
  delete(id: string): Promise<void>;
}
