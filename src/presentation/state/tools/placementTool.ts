import type { CanvasTool } from "./CanvasTool";
import type { PlaceableKind } from "../element-factory/elementFactory";

/**
 * Builds a tool that places a new element of the given kind. Pointer down
 * anchors the element on the pressed cell; dragging sizes it (like resizing an
 * existing element) and the element is committed once on pointer up — a plain
 * click (down and up on the same cell) still yields the default size. The tool
 * stays active so several elements can be placed in a row.
 *
 * `labelKey` is an i18n key (e.g. `"tools.box"`), not display text — this
 * state layer stays free of i18next; the FloatingFooter translates it.
 *
 * The `text` tool is special: pressing on an existing text element opens it for
 * inline editing instead of stacking a new text on top — a plain click on the
 * word you want to change edits it, matching how design tools behave.
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
      if (kind === "text") {
        const hit = context.elementAt(cell);
        if (hit !== null && hit.kind === "text") {
          context.select(hit.id);
          context.beginCanvasInlineEditing(hit.id);
          return;
        }
      }
      context.beginPlacement(kind, cell);
    },
    onCellPointerMove(context, cell) {
      // Advances an active placement drag; when merely hovering (no drag), the
      // store instead parks a default-size ghost under the cursor.
      context.updateDrag(cell);
      context.previewPlacementHover(kind, cell);
    },
    onCellPointerUp(context) {
      context.commitDrag();
    },
  };
}
