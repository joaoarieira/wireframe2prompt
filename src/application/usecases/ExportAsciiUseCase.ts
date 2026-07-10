import type { IComposer } from "../../domain/ports/IComposer";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface ExportAsciiInput {
  document: WireframeDocument;
}

/** Produces the raw ASCII string for the document (the LLM prompt payload). */
export class ExportAsciiUseCase {
  private readonly composer: IComposer;

  constructor(composer: IComposer) {
    this.composer = composer;
  }

  execute(input: ExportAsciiInput): string {
    return this.composer.compose(input.document).toString();
  }
}
