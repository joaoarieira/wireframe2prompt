import type { CanvasTool } from "./CanvasTool";
import type { PlaceableKind } from "../element-factory/elementFactory";

/**
 * Builds a tool that stamps a new element of the given kind on pointer down.
 * The tool stays active so several elements can be placed in a row.
 *
 * @example
 * registry.register(createPlacementTool("box", "Box"));
 */
export function createPlacementTool(
  kind: PlaceableKind,
  label: string,
): CanvasTool {
  return {
    id: kind,
    label,
    onCellPointerDown(context, cell) {
      context.placeElement(kind, cell);
    },
    onCellPointerMove() {
      // placement happens on pointer down only
    },
    onCellPointerUp() {
      // placement happens on pointer down only
    },
  };
}
