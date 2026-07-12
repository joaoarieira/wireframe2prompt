import type { Element } from "../../domain/entities/element/Element";
import type { Position } from "../../domain/entities/position/Position";
import type { PlaceableKind } from "../../presentation/state/element-factory/elementFactory";
import type { ToolContext } from "../../presentation/state/tools/CanvasTool";

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
}
