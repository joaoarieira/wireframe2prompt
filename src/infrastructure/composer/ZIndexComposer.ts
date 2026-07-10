import type { IComposer } from "../../domain/ports/IComposer";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";
import type { GlyphMapperRegistry } from "./GlyphMapperRegistry";

/**
 * Composes a document into a {@link CharBuffer} by walking elements ordered by
 * ascending z-index and writing each one's cells. Because higher z-index
 * elements are written last, they win overlapping cells. Cells outside the grid
 * are clamped by the buffer.
 */
export class ZIndexComposer implements IComposer {
  private readonly registry: GlyphMapperRegistry;

  constructor(registry: GlyphMapperRegistry) {
    this.registry = registry;
  }

  compose(doc: WireframeDocument): CharBuffer {
    const buffer = CharBuffer.create(doc.gridSize);

    for (const element of doc.elementsByZIndex()) {
      const mapper = this.registry.get(element.kind);
      for (const cell of mapper.map(element)) {
        buffer.set(cell.position, cell.char);
      }
    }

    return buffer;
  }
}
