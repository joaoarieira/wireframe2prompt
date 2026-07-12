import type { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../../domain/entities/element/Element";
import type { Position } from "../../../domain/entities/position/Position";
import type { Size } from "../../../domain/entities/size/Size";

/**
 * Returns the topmost element whose bounding box covers the cell, or null.
 * Mirrors the compositor's stacking rule: higher z-index wins, ties resolved
 * by insertion order (later wins), so what you click is what you see.
 *
 * @example
 * const hit = elementAtCell(document, Position.create(3, 2));
 */
export function elementAtCell(
  document: WireframeDocument,
  cell: Position,
): Element | null {
  const stacked = document.elementsByZIndex();
  for (let index = stacked.length - 1; index >= 0; index -= 1) {
    if (elementCovers(stacked[index], cell)) {
      return stacked[index];
    }
  }
  return null;
}

function elementCovers(element: Element, cell: Position): boolean {
  const { position, size } = element;
  return (
    cell.col >= position.col &&
    cell.col < position.col + size.width &&
    cell.row >= position.row &&
    cell.row < position.row + size.height
  );
}

/**
 * Stacking rule for a new element: it climbs only above what it actually
 * covers. No overlap → base z-index 0; otherwise the highest overlapped
 * z-index + 1 (e.g. text dropped on a z2 line that sits on a z1 box → z3).
 */
export function zIndexForPlacement(
  document: WireframeDocument,
  position: Position,
  size: Size,
): number {
  const overlapped = document.elements.filter((element) =>
    boundsIntersect(element, position, size),
  );
  if (overlapped.length === 0) {
    return 0;
  }
  return Math.max(...overlapped.map((element) => element.zIndex)) + 1;
}

function boundsIntersect(
  element: Element,
  position: Position,
  size: Size,
): boolean {
  return (
    position.col < element.position.col + element.size.width &&
    element.position.col < position.col + size.width &&
    position.row < element.position.row + element.size.height &&
    element.position.row < position.row + size.height
  );
}
