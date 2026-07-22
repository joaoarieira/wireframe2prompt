import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { MultilineElement } from "../../../domain/entities/element/MultilineElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import type { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";

type Dir = "left" | "right" | "up" | "down";

/** Direction from `from` to the axis-aligned, distinct neighbour `to`. */
function directionTo(from: Position, to: Position): Dir {
  if (to.col > from.col) return "right";
  if (to.col < from.col) return "left";
  if (to.row > from.row) return "down";
  return "up";
}

/**
 * The corner joining the two neighbour directions at a vertex, taken from the
 * element's border style, or null when the vertex is collinear (both neighbours
 * on the same axis) and so needs no corner — just the straight stroke there.
 */
function cornerGlyph(
  toPrev: Dir,
  toNext: Dir,
  style: BorderStyle,
): CellChar | null {
  const dirs = new Set<Dir>([toPrev, toNext]);
  const horizontal = dirs.has("left") || dirs.has("right");
  const vertical = dirs.has("up") || dirs.has("down");
  if (!horizontal || !vertical) {
    return null;
  }
  if (dirs.has("right") && dirs.has("down")) return style.topLeft;
  if (dirs.has("left") && dirs.has("down")) return style.topRight;
  if (dirs.has("right") && dirs.has("up")) return style.bottomLeft;
  return style.bottomRight;
}

export class MultilineGlyphMapper implements IGlyphMapper {
  readonly kind = "multiline";

  map(element: Element): GlyphCell[] {
    const multiline = element as MultilineElement;
    const style = multiline.borderStyle;
    const points = multiline.absolutePoints();
    const cells: GlyphCell[] = [];

    // Straight strokes first; corners overwrite the shared vertex cells after.
    for (let i = 1; i < points.length; i++) {
      strokeSegment(points[i - 1], points[i], style, cells);
    }
    for (let i = 1; i < points.length - 1; i++) {
      const glyph = cornerGlyph(
        directionTo(points[i], points[i - 1]),
        directionTo(points[i], points[i + 1]),
        style,
      );
      if (glyph !== null) {
        cells.push({ position: points[i], char: glyph });
      }
    }
    return cells;
  }
}

/** Pushes the inclusive straight run of glyphs between two axis-aligned vertices. */
function strokeSegment(
  a: Position,
  b: Position,
  style: BorderStyle,
  cells: GlyphCell[],
): void {
  if (a.row === b.row) {
    const from = Math.min(a.col, b.col);
    const to = Math.max(a.col, b.col);
    for (let col = from; col <= to; col++) {
      cells.push({
        position: Position.create(col, a.row),
        char: style.horizontal,
      });
    }
    return;
  }
  const from = Math.min(a.row, b.row);
  const to = Math.max(a.row, b.row);
  for (let row = from; row <= to; row++) {
    cells.push({
      position: Position.create(a.col, row),
      char: style.vertical,
    });
  }
}
