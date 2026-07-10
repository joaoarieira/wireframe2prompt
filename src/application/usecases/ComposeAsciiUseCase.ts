import type { IComposer } from "../../domain/ports/IComposer";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";

export interface ComposeAsciiInput {
  document: WireframeDocument;
}

/** Rasterizes a document into a {@link CharBuffer}. */
export class ComposeAsciiUseCase {
  private readonly composer: IComposer;

  constructor(composer: IComposer) {
    this.composer = composer;
  }

  execute(input: ComposeAsciiInput): CharBuffer {
    return this.composer.compose(input.document);
  }
}
