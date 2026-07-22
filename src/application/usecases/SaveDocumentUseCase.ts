import type { IDocumentRepository } from "../../domain/ports/IDocumentRepository";
import type { IClock } from "../../domain/ports/IClock";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface SaveDocumentInput {
  document: WireframeDocument;
}

/**
 * Persists the document through the repository port, stamping it with the
 * current time first — the single choke point where `lastEdit` is set, so the
 * document listing can show how long ago each wireframe was edited.
 */
export class SaveDocumentUseCase {
  private readonly repository: IDocumentRepository;
  private readonly clock: IClock;

  constructor(repository: IDocumentRepository, clock: IClock) {
    this.repository = repository;
    this.clock = clock;
  }

  async execute(input: SaveDocumentInput): Promise<void> {
    await this.repository.save(input.document.withLastEdit(this.clock.now()));
  }
}
