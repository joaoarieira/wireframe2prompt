import type { CellChar } from "../entities/cell-char/CellChar";
import type { Element } from "../entities/element/Element";
import type { Position } from "../entities/position/Position";

/** A single cell produced by a mapper, in absolute grid coordinates. */
export interface GlyphCell {
  position: Position;
  char: CellChar;
}

/**
 * Translates one kind of element into the cells that represent it. Mappers are
 * registered by `kind`, so new element types extend the compositor without a
 * giant switch (Open/Closed).
 */
export interface IGlyphMapper {
  readonly kind: string;
  map(element: Element): GlyphCell[];
}
