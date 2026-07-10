import type { IComposer } from "../../domain/ports/IComposer";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";

/** Records the documents it was asked to compose and returns a preset buffer. */
export class SpyComposer implements IComposer {
  readonly composeCalls: WireframeDocument[] = [];
  private readonly result: CharBuffer;

  constructor(result: CharBuffer) {
    this.result = result;
  }

  compose(doc: WireframeDocument): CharBuffer {
    this.composeCalls.push(doc);
    return this.result;
  }
}
