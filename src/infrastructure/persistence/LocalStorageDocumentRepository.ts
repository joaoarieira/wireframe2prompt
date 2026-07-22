import type {
  DocumentSummary,
  IDocumentRepository,
} from "../../domain/ports/IDocumentRepository";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { WebStorage } from "./WebStorage";
import type { SerializedDocument } from "./documentSerialization";
import {
  deserializeDocument,
  serializeDocument,
} from "./documentSerialization";

const DEFAULT_KEY_PREFIX = "wireframe2prompt:doc:";

/**
 * {@link IDocumentRepository} backed by a {@link WebStorage} (the browser
 * `localStorage` in production). Each document is one JSON entry keyed by
 * `${prefix}${id}`. IndexedDB can replace this later without touching the use
 * cases, since they only depend on the port.
 */
export class LocalStorageDocumentRepository implements IDocumentRepository {
  private readonly storage: WebStorage;
  private readonly keyPrefix: string;

  constructor(storage: WebStorage, keyPrefix: string = DEFAULT_KEY_PREFIX) {
    this.storage = storage;
    this.keyPrefix = keyPrefix;
  }

  async save(doc: WireframeDocument): Promise<void> {
    const payload = JSON.stringify(serializeDocument(doc));
    this.storage.setItem(this.keyFor(doc.id), payload);
  }

  async load(id: string): Promise<WireframeDocument | null> {
    const raw = this.storage.getItem(this.keyFor(id));
    if (raw === null) {
      return null;
    }
    return deserializeDocument(JSON.parse(raw) as SerializedDocument);
  }

  async list(): Promise<DocumentSummary[]> {
    // Most-recently-edited first, so the home listing reads top-to-bottom in
    // recency order (see IDocumentRepository.list contract).
    return this.storedKeys()
      .map((key) => this.summaryAt(key))
      .sort((a, b) => b.lastEdit - a.lastEdit);
  }

  async delete(id: string): Promise<void> {
    this.storage.removeItem(this.keyFor(id));
  }

  private keyFor(id: string): string {
    return `${this.keyPrefix}${id}`;
  }

  /** Keys owned by this repository, isolated from any other localStorage use. */
  private storedKeys(): string[] {
    const keys: string[] = [];
    for (let index = 0; index < this.storage.length; index++) {
      const key = this.storage.key(index);
      if (key !== null && key.startsWith(this.keyPrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private summaryAt(key: string): DocumentSummary {
    const parsed = JSON.parse(
      this.storage.getItem(key) as string,
    ) as SerializedDocument;
    return { id: parsed.id, name: parsed.name, lastEdit: parsed.lastEdit ?? 0 };
  }
}
