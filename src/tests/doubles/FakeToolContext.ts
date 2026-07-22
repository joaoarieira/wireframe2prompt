import type { Element } from "../../domain/entities/element/Element";
import type { FieldName } from "../../domain/entities/element/FieldElement";
import type { Position } from "../../domain/entities/position/Position";
import type { PlaceableKind } from "../../presentation/state/element-factory/elementFactory";
import type {
  SurfacePoint,
  ToolContext,
} from "../../presentation/state/tools/CanvasTool";

/**
 * Call-recording {@link ToolContext} fake for tool specs. `hit` controls what
 * `elementAt` reports (default: empty space). `selectionIdsValue` controls what
 * `selectionIds()` returns.
 */
export class FakeToolContext implements ToolContext {
  hit: Element | null = null;
  selectionIdsValue: readonly string[] = [];
  selectCalls: Array<string | null> = [];
  toggleSelectCalls: string[] = [];
  beginPlacementCalls: Array<{ kind: PlaceableKind; cell: Position }> = [];
  previewPlacementHoverCalls: Array<{ kind: PlaceableKind; cell: Position }> =
    [];
  beginMoveCalls: Array<{ elementIds: readonly string[]; cell: Position }> = [];
  updateDragCalls: Position[] = [];
  commitDragCalls = 0;
  beginDrawStrokeCalls: Position[] = [];
  beginEraseStrokeCalls: Position[] = [];
  extendStrokeCalls: Position[] = [];
  commitStrokeCalls = 0;
  beginMultilineCalls: Position[] = [];
  extendMultilineCalls: Position[] = [];
  commitMultilineCalls = 0;
  beginPanCalls: SurfacePoint[] = [];
  updatePanCalls: SurfacePoint[] = [];
  endPanCalls = 0;
  beginCanvasInlineEditingCalls: string[] = [];
  beginCanvasFieldEditingCalls: Array<{ elementId: string; field: FieldName }> =
    [];
  beginMarqueeCalls: Position[] = [];
  updateMarqueeCalls: Position[] = [];
  commitMarqueeCalls: boolean[] = [];

  elementAt(): Element | null {
    return this.hit;
  }

  selectionIds(): readonly string[] {
    return this.selectionIdsValue;
  }

  select(elementId: string | null): void {
    this.selectCalls.push(elementId);
  }

  toggleSelect(elementId: string): void {
    this.toggleSelectCalls.push(elementId);
  }

  beginPlacement(kind: PlaceableKind, cell: Position): void {
    this.beginPlacementCalls.push({ kind, cell });
  }

  previewPlacementHover(kind: PlaceableKind, cell: Position): void {
    this.previewPlacementHoverCalls.push({ kind, cell });
  }

  beginMove(elementIds: readonly string[], cell: Position): void {
    this.beginMoveCalls.push({ elementIds, cell });
  }

  updateDrag(cell: Position): void {
    this.updateDragCalls.push(cell);
  }

  commitDrag(): void {
    this.commitDragCalls += 1;
  }

  beginDrawStroke(cell: Position): void {
    this.beginDrawStrokeCalls.push(cell);
  }

  beginEraseStroke(cell: Position): void {
    this.beginEraseStrokeCalls.push(cell);
  }

  extendStroke(cell: Position): void {
    this.extendStrokeCalls.push(cell);
  }

  commitStroke(): void {
    this.commitStrokeCalls += 1;
  }

  beginMultiline(cell: Position): void {
    this.beginMultilineCalls.push(cell);
  }

  extendMultiline(cell: Position): void {
    this.extendMultilineCalls.push(cell);
  }

  commitMultiline(): void {
    this.commitMultilineCalls += 1;
  }

  beginPan(point: SurfacePoint): void {
    this.beginPanCalls.push(point);
  }

  updatePan(point: SurfacePoint): void {
    this.updatePanCalls.push(point);
  }

  endPan(): void {
    this.endPanCalls += 1;
  }

  beginCanvasInlineEditing(elementId: string): void {
    this.beginCanvasInlineEditingCalls.push(elementId);
  }

  beginCanvasFieldEditing(elementId: string, field: FieldName): void {
    this.beginCanvasFieldEditingCalls.push({ elementId, field });
  }

  beginMarquee(cell: Position): void {
    this.beginMarqueeCalls.push(cell);
  }

  updateMarquee(cell: Position): void {
    this.updateMarqueeCalls.push(cell);
  }

  commitMarquee(additive: boolean): void {
    this.commitMarqueeCalls.push(additive);
  }
}
