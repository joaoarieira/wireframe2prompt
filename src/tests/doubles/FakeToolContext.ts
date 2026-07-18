import type { Element } from "../../domain/entities/element/Element";
import type { Position } from "../../domain/entities/position/Position";
import type { PlaceableKind } from "../../presentation/state/element-factory/elementFactory";
import type {
  SurfacePoint,
  ToolContext,
} from "../../presentation/state/tools/CanvasTool";

/**
 * Call-recording {@link ToolContext} fake for tool specs. `hit` controls what
 * `elementAt` reports (default: empty space).
 */
export class FakeToolContext implements ToolContext {
  hit: Element | null = null;
  selectCalls: Array<string | null> = [];
  placeCalls: Array<{ kind: PlaceableKind; cell: Position }> = [];
  beginMoveCalls: Array<{ elementId: string; cell: Position }> = [];
  updateDragCalls: Position[] = [];
  commitDragCalls = 0;
  beginDrawStrokeCalls: Position[] = [];
  beginEraseStrokeCalls: Position[] = [];
  extendStrokeCalls: Position[] = [];
  commitStrokeCalls = 0;
  beginPanCalls: SurfacePoint[] = [];
  updatePanCalls: SurfacePoint[] = [];
  endPanCalls = 0;
  beginCanvasInlineEditingCalls: string[] = [];

  elementAt(): Element | null {
    return this.hit;
  }

  select(elementId: string | null): void {
    this.selectCalls.push(elementId);
  }

  placeElement(kind: PlaceableKind, cell: Position): void {
    this.placeCalls.push({ kind, cell });
  }

  beginMove(elementId: string, cell: Position): void {
    this.beginMoveCalls.push({ elementId, cell });
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
}
