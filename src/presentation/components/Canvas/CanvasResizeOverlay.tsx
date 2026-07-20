import { useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { useEditorStore } from "../../state/app-store/appStore";
import { useColorScheme } from "../../hooks/useColorScheme";
import { resizeCursor } from "./cursorGlyphs";

interface CanvasResizeOverlayProps {
  /** The previewed grid size; the paper is exactly this size, so `inset-0` fits. */
  previewSize: GridSize;
  /** The paper element, used to read its screen rect when the drag begins. */
  canvasRef: RefObject<HTMLDivElement | null>;
}

/**
 * Selection-style frame around the whole paper with a bottom-right resize
 * handle that drives the canvas-resize drag. Mirrors {@link SelectionOverlay}
 * but resizes the grid instead of an element: on pointer down it captures the
 * paper's rect as a fixed reference frame so live resizing never feeds back
 * into the cell math.
 */
export function CanvasResizeOverlay({
  previewSize,
  canvasRef,
}: CanvasResizeOverlayProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const beginCanvasResizeDrag = useEditorStore(
    (state) => state.beginCanvasResizeDrag,
  );
  const updateCanvasResizeDrag = useEditorStore(
    (state) => state.updateCanvasResizeDrag,
  );
  const endCanvasResizeDrag = useEditorStore(
    (state) => state.endCanvasResizeDrag,
  );
  const resizing = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect === undefined || rect.width <= 0 || rect.height <= 0) {
      return;
    }
    resizing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginCanvasResizeDrag({
      originLeft: rect.left,
      originTop: rect.top,
      cellWidthPx: rect.width / previewSize.cols,
      cellHeightPx: rect.height / previewSize.rows,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!resizing.current) {
      return;
    }
    updateCanvasResizeDrag({ clientX: event.clientX, clientY: event.clientY });
  };

  const handlePointerUp = () => {
    if (!resizing.current) {
      return;
    }
    resizing.current = false;
    endCanvasResizeDrag();
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 border-2 border-dashed border-primary"
      data-testid="canvas-resize-overlay"
    >
      <span
        role="button"
        data-resize-handle
        aria-label={t("canvas.resizeCanvas")}
        className="pointer-events-auto absolute -right-1 -bottom-1 size-3 bg-primary"
        style={{ cursor: resizeCursor(scheme) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
