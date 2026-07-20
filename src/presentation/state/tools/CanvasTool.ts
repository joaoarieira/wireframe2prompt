import type { Element } from "../../../domain/entities/element/Element";
import type { Position } from "../../../domain/entities/position/Position";
import type { PlaceableKind } from "../element-factory/elementFactory";

/** Raw pointer coordinates in CSS pixels, as-received from DOM events. */
export interface SurfacePoint {
  clientX: number;
  clientY: number;
  /** `PointerEvent.button` (0 = primary, 2 = secondary, -1 during move). */
  button: number;
  shiftKey: boolean;
}

/**
 * The narrow slice of editor behaviour a canvas tool is allowed to drive.
 * Tools never touch the store or use cases directly — the store hands them
 * this context, which keeps tools trivial to test and to add.
 */
export interface ToolContext {
  elementAt(cell: Position): Element | null;
  select(elementId: string | null): void;
  selectionIds(): readonly string[];
  toggleSelect(elementId: string): void;
  beginPlacement(kind: PlaceableKind, cell: Position): void;
  beginMove(elementIds: readonly string[], cell: Position): void;
  updateDrag(cell: Position): void;
  commitDrag(): void;
  beginDrawStroke(cell: Position): void;
  beginEraseStroke(cell: Position): void;
  extendStroke(cell: Position): void;
  commitStroke(): void;
  beginPan(point: SurfacePoint): void;
  updatePan(point: SurfacePoint): void;
  endPan(): void;
  beginCanvasInlineEditing(elementId: string): void;
  beginMarquee(cell: Position): void;
  updateMarquee(cell: Position): void;
  commitMarquee(additive: boolean): void;
}

/**
 * Strategy for interpreting grid pointer events. The active tool decides what
 * a click/drag means; the surface only reports cells.
 */
export interface CanvasTool {
  readonly id: string;
  /**
   * i18n key for the tool's palette label (e.g. `"tools.box"`). This state
   * layer must not import i18next — the FloatingFooter resolves it with
   * `t(tool.labelKey)`.
   */
  readonly labelKey: string;
  onCellPointerDown(
    context: ToolContext,
    cell: Position,
    point: SurfacePoint,
  ): void;
  onCellPointerMove(
    context: ToolContext,
    cell: Position,
    point: SurfacePoint,
  ): void;
  onCellPointerUp(
    context: ToolContext,
    cell: Position,
    point: SurfacePoint,
  ): void;
  onCellDoubleClick?(context: ToolContext, cell: Position): void;
}
