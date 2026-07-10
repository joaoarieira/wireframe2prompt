import type { IDocumentRepository } from "../../domain/ports/IDocumentRepository";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface SaveDocumentInput {
  document: WireframeDocument;
}

/** Persists the document through the repository port. */
export class SaveDocumentUseCase {
  private readonly repository: IDocumentRepository;

  constructor(repository: IDocumentRepository) {
    this.repository = repository;
  }

  async execute(input: SaveDocumentInput): Promise<void> {
    await this.repository.save(input.document);
  }
}
