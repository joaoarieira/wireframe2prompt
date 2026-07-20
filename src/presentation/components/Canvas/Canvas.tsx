import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import type { GridSurfaceComponent } from "./GridSurface";
import { DomGridSurface } from "./DomGridSurface";
import { SelectionOverlay } from "./SelectionOverlay";
import { CanvasResizeOverlay } from "./CanvasResizeOverlay";
import { CanvasResizeControl } from "./CanvasResizeControl";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { TextEditOverlay } from "./TextEditOverlay";
import { FieldEditOverlay } from "./FieldEditOverlay";
import { cellAtPoint } from "./cellGeometry";
import type { PointLike } from "./cellGeometry";
import { canvasCursor } from "./cursorGlyphs";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useEditorStore } from "../../state/app-store/appStore";
import {
  previewedDocument,
  selectedElementsOf,
} from "../../state/editor-store/editorStore";
import { editorActionForKey } from "../../state/keyboard/editorKeyAction";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { FieldElement } from "../../../domain/entities/element/FieldElement";
import { isPlaceableKind } from "../../state/element-factory/elementFactory";

const CELL_SIZE_VARS = { "--cell-w": "10px", "--cell-h": "18px" };

/** `PointerEvent.button` for the mouse wheel/middle button. */
const MIDDLE_MOUSE_BUTTON = 1;

/** `PointerEvent.button` for the left/primary button. */
const PRIMARY_MOUSE_BUTTON = 0;

/** Wheel pan travels a third of the raw scroll delta — it was moving too far. */
const WHEEL_PAN_FRACTION = 1 / 3;

/** Eases the visual transform so wheel scrolling glides instead of jumping. */
const SMOOTH_PAN_TRANSITION = "transform 150ms ease-out";

export interface CanvasProps {
  /** Rendering strategy; defaults to the DOM grid (CanvasRenderer later). */
  surface?: GridSurfaceComponent;
}

/**
 * The interactive drawing area: rasterizes the (drag/stroke-previewed) document
 * through the store, delegates painting to the pluggable surface, and overlays
 * selection + resize handle. Also the keyboard target for editor shortcuts.
 */
export function Canvas({ surface: Surface = DomGridSurface }: CanvasProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panning = useRef(false);
  // Enables the eased transform, but only for wheel scrolling: zoom and pointer
  // drags below turn it off so they stay pixel-exact and lag-free.
  const [smoothScroll, setSmoothScroll] = useState(false);
  const document = useEditorStore((state) => state.document);
  const drag = useEditorStore((state) => state.drag);
  const stroke = useEditorStore((state) => state.stroke);
  const pastePreview = useEditorStore((state) => state.pastePreview);
  const placementHover = useEditorStore((state) => state.placementHover);
  const marquee = useEditorStore((state) => state.marquee);
  const selectedElementIds = useEditorStore(
    (state) => state.selectedElementIds,
  );
  const activeToolId = useEditorStore((state) => state.activeToolId);
  const panDrag = useEditorStore((state) => state.panDrag);
  const viewport = useEditorStore((state) => state.viewport);
  const canvasResize = useEditorStore((state) => state.canvasResize);
  const composeBuffer = useEditorStore((state) => state.composeBuffer);
  const pointerDownOnCell = useEditorStore((state) => state.pointerDownOnCell);
  const pointerMoveOnCell = useEditorStore((state) => state.pointerMoveOnCell);
  const pointerUpOnCell = useEditorStore((state) => state.pointerUpOnCell);
  const applyKeyAction = useEditorStore((state) => state.applyKeyAction);
  const doubleClickOnCell = useEditorStore((state) => state.doubleClickOnCell);
  const canvasEditingElementId = useEditorStore(
    (state) => state.canvasEditingElementId,
  );
  const canvasEditingField = useEditorStore(
    (state) => state.canvasEditingField,
  );
  const endTextEditing = useEditorStore((state) => state.endTextEditing);
  const zoomAtPoint = useEditorStore((state) => state.zoomAtPoint);
  const beginPan = useEditorStore((state) => state.beginPan);
  const updatePan = useEditorStore((state) => state.updatePan);
  const endPan = useEditorStore((state) => state.endPan);
  const panViewportBy = useEditorStore((state) => state.panViewportBy);
  const currentZoom = useEditorStore((state) => state.viewport.zoom);
  const scheme = useColorScheme();

  // Wheel handling via a native (non-passive) listener so we can
  // preventDefault() and pre-empt the browser's page zoom/scroll:
  //   - Ctrl+wheel  → zoom, anchored under the cursor (unchanged);
  //   - Shift+wheel → pan horizontally;
  //   - wheel       → pan vertically.
  // `deltaY || deltaX` reads the scroll amount on either axis, since browsers
  // report Shift+wheel as horizontal delta on some platforms.
  useEffect(() => {
    const el = rootRef.current;
    if (el === null) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey) {
        setSmoothScroll(false);
        const rect = el.getBoundingClientRect();
        const anchorX = (event.clientX - rect.left) / currentZoom;
        const anchorY = (event.clientY - rect.top) / currentZoom;
        const step = event.deltaY > 0 ? -0.1 : 0.1;
        zoomAtPoint(currentZoom + step, anchorX, anchorY);
        return;
      }
      setSmoothScroll(true);
      const amount = (event.deltaY || event.deltaX) * WHEEL_PAN_FRACTION;
      if (event.shiftKey) {
        panViewportBy(-amount, 0);
      } else {
        panViewportBy(0, -amount);
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [currentZoom, zoomAtPoint, panViewportBy]);

  const previewed =
    document === null
      ? null
      : previewedDocument(document, drag, stroke, pastePreview, placementHover);
  // While the size selector is open, the paper renders at the previewed grid
  // size so shrinking/growing is visible live; elements outside are clipped by
  // the compositor (kept, not deleted) and reappear when the grid grows again.
  const visibleDocument =
    previewed === null || canvasResize === null
      ? previewed
      : previewed.resizeGrid(canvasResize.previewSize);
  const buffer = useMemo(
    () => (visibleDocument === null ? null : composeBuffer(visibleDocument)),
    [visibleDocument, composeBuffer],
  );

  if (document === null || visibleDocument === null || buffer === null) {
    return null;
  }

  const selectedElements = selectedElementsOf({
    document: visibleDocument,
    selectedElementIds,
  });

  const editingElement =
    canvasEditingElementId !== null
      ? (visibleDocument.getElement(canvasEditingElementId) ?? null)
      : null;
  const textEditElement =
    editingElement instanceof TextElement ? editingElement : null;
  const fieldEditElement =
    editingElement instanceof FieldElement && canvasEditingField !== null
      ? editingElement
      : null;

  const cellFromPoint = (point: PointLike) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect === undefined) {
      return null;
    }
    return cellAtPoint(
      rect,
      document.gridSize.cols,
      document.gridSize.rows,
      point,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Let text overlays (textarea/input) keep their native clipboard behaviour.
    if (
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLInputElement
    ) {
      return;
    }
    const action = editorActionForKey(event);
    if (action === null) {
      return;
    }
    event.preventDefault();
    applyKeyAction(action);
  };

  // Two gestures pan from this outer element:
  //   - the mouse wheel (middle button) with ANY tool — it borrows the hand
  //     tool without touching the active one (we never call setActiveTool);
  //   - the hand tool's primary button on the canvas backdrop (the padding, or
  //     wherever the paper was panned off to) — `event.target === currentTarget`
  //     means the press missed the paper. Over the paper the grid surface's tool
  //     routing already drives the hand pan, so we must not double-start it here.
  // Panning from the backdrop is what lets the user recover a canvas dragged
  // fully out of view.
  const shouldStartPan = (event: PointerEvent<HTMLDivElement>): boolean => {
    if (event.button === MIDDLE_MOUSE_BUTTON) {
      return true;
    }
    return (
      event.button === PRIMARY_MOUSE_BUTTON &&
      activeToolId === "hand" &&
      event.target === event.currentTarget
    );
  };

  const handlePanStart = (event: PointerEvent<HTMLDivElement>) => {
    // A click on the canvas backdrop (outside the paper) while canvas text
    // editing is active should end the editing session.
    if (
      canvasEditingElementId !== null &&
      event.target === event.currentTarget &&
      event.button === PRIMARY_MOUSE_BUTTON
    ) {
      endTextEditing();
    }
    if (!shouldStartPan(event)) {
      return;
    }
    event.preventDefault(); // stops the browser's middle-button autoscroll
    panning.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginPan({
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      shiftKey: event.shiftKey,
    });
  };

  const handlePanMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panning.current) {
      return;
    }
    updatePan({
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      shiftKey: event.shiftKey,
    });
  };

  const handlePanEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!panning.current) {
      return;
    }
    panning.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    endPan();
  };

  // A themed SVG cursor for the whole canvas (backdrop included), since the hand
  // tool and middle-button pan work everywhere now — not just over the paper. It
  // must live on this outer element because the pan gesture captures the pointer
  // here, and a captured pointer shows the CAPTURING element's cursor; putting it
  // deeper let it flip back mid-drag. `cursor` inherits, so descendants (the grid
  // included) pick it up — no per-child override. `panDrag` set → the hand-grab
  // glyph; an idle hand tool → an open hand; any other tool → the arrow.
  const cursor = canvasCursor({
    activeToolId,
    panning: panDrag !== null,
    scheme,
  });

  return (
    <div
      className="relative grid h-full place-items-center overflow-hidden bg-base-300 p-8 outline-none"
      style={{ cursor }}
      tabIndex={0}
      data-testid="canvas"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePanStart}
      onPointerMove={handlePanMove}
      onPointerUp={handlePanEnd}
    >
      <div
        data-testid="canvas-transform"
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
          transformOrigin: "top left",
          // Smooth only wheel scrolling; an active drag (panDrag) stays instant.
          transition:
            smoothScroll && panDrag === null ? SMOOTH_PAN_TRANSITION : "none",
        }}
      >
        <div
          ref={rootRef}
          className="relative bg-base-100 font-mono text-sm shadow-md"
          style={CELL_SIZE_VARS as CSSProperties}
        >
          <Surface
            buffer={buffer}
            onCellPointerDown={pointerDownOnCell}
            onCellPointerMove={pointerMoveOnCell}
            onCellPointerUp={pointerUpOnCell}
            onCellDoubleClick={doubleClickOnCell}
            // Placement tools show a full element ghost under the cursor, so the
            // per-cell hover outline would be redundant noise there.
            showHoverHighlight={!isPlaceableKind(activeToolId)}
          />
          {selectedElements.map((el) => (
            <SelectionOverlay
              key={el.id}
              element={el}
              getCell={cellFromPoint}
              showResizeHandle={selectedElements.length === 1}
            />
          ))}
          {canvasResize !== null && (
            <CanvasResizeOverlay
              previewSize={canvasResize.previewSize}
              canvasRef={rootRef}
            />
          )}
          {marquee !== null && <MarqueeOverlay marquee={marquee} />}
          {textEditElement !== null && (
            <TextEditOverlay
              element={textEditElement}
              onEnd={endTextEditing}
              canvasRef={rootRef}
            />
          )}
          {fieldEditElement !== null && canvasEditingField !== null && (
            <FieldEditOverlay
              element={fieldEditElement}
              field={canvasEditingField}
              onEnd={endTextEditing}
              canvasRef={rootRef}
            />
          )}
        </div>
      </div>
      <CanvasResizeControl />
    </div>
  );
}
