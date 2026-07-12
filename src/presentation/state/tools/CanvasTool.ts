import type { Element } from "../../../domain/entities/element/Element";
import type { Position } from "../../../domain/entities/position/Position";
import type { PlaceableKind } from "../element-factory/elementFactory";

/**
 * The narrow slice of editor behaviour a canvas tool is allowed to drive.
 * Tools never touch the store or use cases directly — the store hands them
 * this context, which keeps tools trivial to test and to add (hand/pan and
 * zoom tools will only need extra hooks here, not store rewrites).
 */
export interface ToolContext {
  elementAt(cell: Position): Element | null;
  select(elementId: string | null): void;
  placeElement(kind: PlaceableKind, cell: Position): void;
  beginMove(elementId: string, cell: Position): void;
  updateDrag(cell: Position): void;
  commitDrag(): void;
}

/**
 * Strategy for interpreting grid pointer events. The active tool decides what
 * a click/drag means; the surface only reports cells.
 */
export interface CanvasTool {
  readonly id: string;
  readonly label: string;
  onCellPointerDown(context: ToolContext, cell: Position): void;
  onCellPointerMove(context: ToolContext, cell: Position): void;
  onCellPointerUp(context: ToolContext, cell: Position): void;
}
