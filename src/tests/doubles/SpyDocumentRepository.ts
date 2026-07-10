import type {
  DocumentSummary,
  IDocumentRepository,
} from "../../domain/ports/IDocumentRepository";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

/** Records calls and keeps an in-memory store for load/list/delete. */
export class SpyDocumentRepository implements IDocumentRepository {
  readonly saveCalls: WireframeDocument[] = [];
  readonly loadCalls: string[] = [];
  readonly deleteCalls: string[] = [];
  private readonly store = new Map<string, WireframeDocument>();

  async save(doc: WireframeDocument): Promise<void> {
    this.saveCalls.push(doc);
    this.store.set(doc.id, doc);
  }

  async load(id: string): Promise<WireframeDocument | null> {
    this.loadCalls.push(id);
    return this.store.get(id) ?? null;
  }

  async list(): Promise<DocumentSummary[]> {
    return [...this.store.values()].map((doc) => ({
      id: doc.id,
      name: doc.name,
    }));
  }

  async delete(id: string): Promise<void> {
    this.deleteCalls.push(id);
    this.store.delete(id);
  }
}
