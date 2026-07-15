import type { CanvasTool } from "./CanvasTool";
import type { PlaceableKind } from "../element-factory/elementFactory";

/**
 * Builds a tool that stamps a new element of the given kind on pointer down.
 * The tool stays active so several elements can be placed in a row.
 *
 * `labelKey` is an i18n key (e.g. `"tools.box"`), not display text — this
 * state layer stays free of i18next; the FloatingFooter translates it.
 *
 * @example
 * registry.register(createPlacementTool("box", "tools.box"));
 */
export function createPlacementTool(
  kind: PlaceableKind,
  labelKey: string,
): CanvasTool {
  return {
    id: kind,
    labelKey,
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
