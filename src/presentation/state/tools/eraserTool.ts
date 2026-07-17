import type { CanvasTool } from "./CanvasTool";

/**
 * Eraser tool: pointer down begins an erase stroke, move extends it, up
 * commits the whole gesture as one undo snapshot.
 */
export const eraserTool: CanvasTool = {
  id: "eraser",
  labelKey: "tools.eraser",
  onCellPointerDown(context, cell) {
    context.beginEraseStroke(cell);
  },
  onCellPointerMove(context, cell) {
    context.extendStroke(cell);
  },
  onCellPointerUp(context) {
    context.commitStroke();
  },
};
