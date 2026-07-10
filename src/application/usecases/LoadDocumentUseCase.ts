import type { IDocumentRepository } from "../../domain/ports/IDocumentRepository";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface LoadDocumentInput {
  id: string;
}

/** Loads a document by id, or returns null when it does not exist. */
export class LoadDocumentUseCase {
  private readonly repository: IDocumentRepository;

  constructor(repository: IDocumentRepository) {
    this.repository = repository;
  }

  async execute(input: LoadDocumentInput): Promise<WireframeDocument | null> {
    return this.repository.load(input.id);
  }
}
