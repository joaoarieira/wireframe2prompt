import type { CanvasTool } from "./CanvasTool";

/**
 * Multiline tool: a single drag draws several connected orthogonal lines.
 * Pointer down anchors the path's first vertex, each move grows it (adding a
 * corner whenever the drag changes axis), and pointer up commits the whole
 * polyline as one element (and one undo snapshot).
 */
export const multilineTool: CanvasTool = {
  id: "multiline",
  labelKey: "tools.multiline",
  onCellPointerDown(context, cell) {
    context.beginMultiline(cell);
  },
  onCellPointerMove(context, cell) {
    context.extendMultiline(cell);
  },
  onCellPointerUp(context) {
    context.commitMultiline();
  },
};
