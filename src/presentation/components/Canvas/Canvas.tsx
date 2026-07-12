import { useMemo, useRef } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { GridSurfaceComponent } from "./GridSurface";
import { DomGridSurface } from "./DomGridSurface";
import { SelectionOverlay } from "./SelectionOverlay";
import { cellAtPoint } from "./cellGeometry";
import type { PointLike } from "./cellGeometry";
import { useEditorStore } from "../../state/app-store/appStore";
import {
  previewedDocument,
  selectedElementOf,
} from "../../state/editor-store/editorStore";
import { editorActionForKey } from "../../state/keyboard/editorKeyAction";

const CELL_SIZE_VARS = { "--cell-w": "10px", "--cell-h": "18px" };

export interface CanvasProps {
  /** Rendering strategy; defaults to the DOM grid (CanvasRenderer later). */
  surface?: GridSurfaceComponent;
}

/**
 * The interactive drawing area: rasterizes the (drag-previewed) document
 * through the store, delegates painting to the pluggable surface, and overlays
 * selection + resize handle. Also the keyboard target for editor shortcuts.
 */
export function Canvas({ surface: Surface = DomGridSurface }: CanvasProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const document = useEditorStore((state) => state.document);
  const drag = useEditorStore((state) => state.drag);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const viewport = useEditorStore((state) => state.viewport);
  const composeBuffer = useEditorStore((state) => state.composeBuffer);
  const pointerDownOnCell = useEditorStore((state) => state.pointerDownOnCell);
  const pointerMoveOnCell = useEditorStore((state) => state.pointerMoveOnCell);
  const pointerUpOnCell = useEditorStore((state) => state.pointerUpOnCell);
  const applyKeyAction = useEditorStore((state) => state.applyKeyAction);

  const visibleDocument =
    document === null ? null : previewedDocument(document, drag);
  const buffer = useMemo(
    () => (visibleDocument === null ? null : composeBuffer(visibleDocument)),
    [visibleDocument, composeBuffer],
  );

  if (document === null || visibleDocument === null || buffer === null) {
    return null;
  }

  const selectedElement = selectedElementOf({
    document: visibleDocument,
    selectedElementId,
  });

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
    const action = editorActionForKey(event);
    if (action === null) {
      return;
    }
    event.preventDefault();
    applyKeyAction(action);
  };

  return (
    <div
      className="grid h-full place-items-center overflow-auto bg-base-300 p-8 outline-none"
      tabIndex={0}
      data-testid="canvas"
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
          transformOrigin: "top left",
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
          />
          {selectedElement !== null && (
            <SelectionOverlay
              element={selectedElement}
              getCell={cellFromPoint}
            />
          )}
        </div>
      </div>
    </div>
  );
}
