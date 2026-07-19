import type { CanvasTool } from "./CanvasTool";

/**
 * Default tool: Figma-style multi-select with marquee and shift+click.
 *
 * Left-button on element: select (or shift-toggle) and begin move drag.
 * Left-button on empty space: begin marquee (1-cell commit = clear selection).
 * Right-button anywhere: begin marquee (additive via shift, resolved on up).
 * Shift+click on element: toggle without starting a drag.
 * Clicking an already-selected element: moves the whole group.
 */
export const selectTool: CanvasTool = {
  id: "select",
  labelKey: "tools.select",

  onCellPointerDown(context, cell, point) {
    const hit = context.elementAt(cell);
    if (hit === null) {
      context.beginMarquee(cell);
      return;
    }
    if (point.shiftKey) {
      context.toggleSelect(hit.id);
      return;
    }
    const ids = context.selectionIds();
    if (ids.includes(hit.id)) {
      context.beginMove(ids, cell);
    } else {
      context.select(hit.id);
      context.beginMove([hit.id], cell);
    }
  },

  onCellSecondaryPointerDown(context, cell) {
    context.beginMarquee(cell);
  },

  onCellPointerMove(context, cell) {
    context.updateDrag(cell);
    context.updateMarquee(cell);
  },

  onCellPointerUp(context, _cell, point) {
    context.commitDrag();
    context.commitMarquee(point.shiftKey);
  },

  onCellDoubleClick(context, cell) {
    const hit = context.elementAt(cell);
    if (hit === null || hit.kind !== "text") {
      return;
    }
    context.select(hit.id);
    context.beginCanvasInlineEditing(hit.id);
  },
};
