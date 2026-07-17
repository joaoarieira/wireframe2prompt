import type { CanvasTool, SurfacePoint } from "./CanvasTool";

/**
 * Hand tool: drag to pan the viewport. Delta is in CSS pixels and is summed
 * directly into the viewport offset — the canvas transform applies it after
 * the scale, so no unit conversion is needed.
 */
export const handTool: CanvasTool = {
  id: "hand",
  labelKey: "tools.hand",
  onCellPointerDown(context, _cell, point: SurfacePoint) {
    context.beginPan(point);
  },
  onCellPointerMove(context, _cell, point: SurfacePoint) {
    context.updatePan(point);
  },
  onCellPointerUp(context) {
    context.endPan();
  },
};
