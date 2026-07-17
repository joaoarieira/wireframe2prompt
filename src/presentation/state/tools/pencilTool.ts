import type { CanvasTool } from "./CanvasTool";

/**
 * Pencil tool: pointer down begins a draw stroke on a (possibly new) freedraw
 * element, move extends it cell by cell, up commits the whole gesture as one
 * undo snapshot.
 */
export const pencilTool: CanvasTool = {
  id: "pencil",
  labelKey: "tools.pencil",
  onCellPointerDown(context, cell) {
    context.beginDrawStroke(cell);
  },
  onCellPointerMove(context, cell) {
    context.extendStroke(cell);
  },
  onCellPointerUp(context) {
    context.commitStroke();
  },
};
