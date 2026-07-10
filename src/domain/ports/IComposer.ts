import type { WireframeDocument } from "../aggregates/wireframe-document/WireframeDocument";
import type { CharBuffer } from "../value-objects/char-buffer/CharBuffer";

/**
 * Central rasterizer port: walks the document's elements ordered by z-index and
 * writes them into a {@link CharBuffer} (last one wins per cell).
 */
export interface IComposer {
  compose(doc: WireframeDocument): CharBuffer;
}
