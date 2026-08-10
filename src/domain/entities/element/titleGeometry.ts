import { Position } from "../position/Position";
import { Size } from "../size/Size";

export interface TitleRegion {
  position: Position;
  size: Size;
}

/** Rows a titled box needs before its glyph mapper draws the title at all. */
const MIN_TITLED_HEIGHT = 3;

/**
 * Editable region of a boxed title: second row, indented two columns past the
 * border, `reservedCols` narrower than the box in total. Mirrors what
 * CardGlyphMapper/ModalGlyphMapper rasterize, so an inline editor placed here
 * sits exactly over the glyphs it replaces.
 *
 * @example titleRegion(Position.create(3, 4), Size.create(12, 6), 4)
 *          // → position (5, 5), size 8×1
 */
export function titleRegion(
  position: Position,
  size: Size,
  reservedCols: number,
): TitleRegion {
  return {
    position: Position.create(position.col + 2, position.row + 1),
    size: Size.create(Math.max(1, size.width - reservedCols), 1),
  };
}

/**
 * Whether a cell falls on the title row, for canvas double-click editing. The
 * whole width of that row counts (same tolerance as FieldElement.fieldAtCell),
 * and a box too short for the mapper to draw a title has no title row.
 *
 * @example isTitleCell(Position.create(0, 0), Size.create(12, 6), Position.create(0, 1)) // → true
 */
export function isTitleCell(
  position: Position,
  size: Size,
  cell: Position,
): boolean {
  if (size.height < MIN_TITLED_HEIGHT) {
    return false;
  }
  const withinCols =
    cell.col >= position.col && cell.col < position.col + size.width;
  return withinCols && cell.row === position.row + 1;
}
