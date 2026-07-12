import type { CanvasTool } from "./CanvasTool";

/**
 * Default tool: click selects the topmost element under the cell (or clears
 * the selection on empty space) and dragging moves it. The move is committed
 * as a single MoveElement use case on pointer up, so one gesture costs one
 * undo snapshot.
 */
export const selectTool: CanvasTool = {
  id: "select",
  label: "Select",
  onCellPointerDown(context, cell) {
    const hit = context.elementAt(cell);
    if (hit === null) {
      context.select(null);
      return;
    }
    context.select(hit.id);
    context.beginMove(hit.id, cell);
  },
  onCellPointerMove(context, cell) {
    context.updateDrag(cell);
  },
  onCellPointerUp(context) {
    context.commitDrag();
  },
};
