import { useRef } from "react";
import type { PointerEvent } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Element } from "../../../domain/entities/element/Element";
import type { PointLike } from "./cellGeometry";
import type { Position } from "../../../domain/entities/position/Position";
import { useEditorStore } from "../../state/app-store/appStore";
import { useColorScheme } from "../../hooks/useColorScheme";
import { resizeCursor } from "./cursorGlyphs";

interface SelectionOverlayProps {
  /** Element bounds to highlight (already drag-previewed by the Canvas). */
  element: Element;
  /** Maps a pointer event to the grid cell under it (owned by the Canvas). */
  getCell(point: PointLike): Position | null;
  /** Show the resize handle. True only when exactly one element is selected. */
  showResizeHandle: boolean;
  /**
   * Show the floating pencil button that opens the inspector. True only where
   * the inspector doesn't auto-open (phone/tablet) and a single element is
   * selected; on desktop the inspector opens on select so the button is hidden.
   */
  showEditButton: boolean;
}

/**
 * Selection rectangle plus the bottom-right resize handle. The overlay itself
 * is pointer-transparent so the grid keeps receiving move drags; only the
 * handle grabs the pointer, driving the store's resize-drag lifecycle.
 */
export function SelectionOverlay({
  element,
  getCell,
  showResizeHandle,
  showEditButton,
}: SelectionOverlayProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const openInspector = useEditorStore((state) => state.openInspector);
  const removeSelectedElements = useEditorStore(
    (state) => state.removeSelectedElements,
  );
  const beginResize = useEditorStore((state) => state.beginResize);
  const updateDrag = useEditorStore((state) => state.updateDrag);
  const commitDrag = useEditorStore((state) => state.commitDrag);
  const cancelDrag = useEditorStore((state) => state.cancelDrag);
  const resizing = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    const cell = getCell(event);
    if (cell === null) {
      return;
    }
    resizing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginResize(element.id, cell);
  };

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const cell = getCell(event);
    if (!resizing.current || cell === null) {
      return;
    }
    updateDrag(cell);
  };

  const handlePointerUp = () => {
    if (!resizing.current) {
      return;
    }
    resizing.current = false;
    commitDrag();
  };

  // If the browser aborts the pointer mid-drag (e.g. a system gesture), drop
  // the resize preview instead of leaving it stuck in the store.
  const handlePointerCancel = () => {
    if (!resizing.current) {
      return;
    }
    resizing.current = false;
    cancelDrag();
  };

  return (
    <div
      className="pointer-events-none absolute border border-primary"
      data-testid="selection-overlay"
      style={{
        left: `calc(var(--cell-w) * ${element.position.col})`,
        top: `calc(var(--cell-h) * ${element.position.row})`,
        width: `calc(var(--cell-w) * ${element.size.width})`,
        height: `calc(var(--cell-h) * ${element.size.height})`,
      }}
    >
      {showEditButton && (
        <button
          type="button"
          aria-label={t("canvas.editElement")}
          // Sits just above the selection's top-left corner (see the wireframe
          // in the mobile plan). `pointer-events-auto` re-enables clicks on this
          // button inside the otherwise pointer-transparent overlay; `touch-none`
          // keeps a tap from being stolen as a scroll/pan gesture.
          className="pointer-events-auto absolute bottom-full left-0 mb-1 grid size-3.5 touch-none place-items-center rounded text-primary hover:bg-base-200 [@media(pointer:coarse)]:size-6"
          onClick={openInspector}
        >
          <SquarePen
            className="size-2.5 [@media(pointer:coarse)]:size-4"
            aria-hidden
          />
        </button>
      )}
      {showEditButton && (
        <button
          type="button"
          aria-label={t("canvas.deleteElement")}
          // Sits just right of the edit button (see mobile plan); shares its
          // pointer-events/touch handling. Themed `error` (red) mirrors the
          // edit button's `primary` (blue) tint.
          className="pointer-events-auto absolute bottom-full left-4 mb-1 grid size-3.5 touch-none place-items-center rounded text-error hover:bg-base-200 [@media(pointer:coarse)]:left-7 [@media(pointer:coarse)]:size-6"
          onClick={removeSelectedElements}
        >
          <Trash2
            className="size-2.5 [@media(pointer:coarse)]:size-4"
            aria-hidden
          />
        </button>
      )}
      {showResizeHandle && (
        <span
          role="button"
          data-resize-handle
          aria-label={t("canvas.resize")}
          // The themed `move-diagonal-2` glyph; the pointer is captured on this
          // span during the drag, so a captured pointer keeps showing it start
          // to finish instead of flipping to the element under the cursor. The
          // visible dot stays 8px, but a transparent `before:` pad grows the hit
          // area to ≥44px on coarse (touch) pointers without moving the glyph.
          // `touch-none` (touch-action: none) stops the browser from stealing a
          // touch drag as a scroll/pan — without it the resize pointer is
          // cancelled the moment the finger moves and the resize never happens.
          className="pointer-events-auto absolute -right-1 -bottom-1 size-2 touch-none bg-primary before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 [@media(pointer:coarse)]:before:size-11"
          style={{ cursor: resizeCursor(scheme) }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />
      )}
    </div>
  );
}
