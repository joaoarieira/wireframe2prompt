import { useRef } from "react";
import type { PointerEvent } from "react";
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
}: SelectionOverlayProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const beginResize = useEditorStore((state) => state.beginResize);
  const updateDrag = useEditorStore((state) => state.updateDrag);
  const commitDrag = useEditorStore((state) => state.commitDrag);
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
      {showResizeHandle && (
        <span
          role="button"
          data-resize-handle
          aria-label={t("canvas.resize")}
          // The themed `move-diagonal-2` glyph; the pointer is captured on this
          // span during the drag, so a captured pointer keeps showing it start
          // to finish instead of flipping to the element under the cursor.
          className="pointer-events-auto absolute -right-1 -bottom-1 size-2 bg-primary"
          style={{ cursor: resizeCursor(scheme) }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
}
