import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";
import type { AppContainer } from "../../../di/container";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../../domain/entities/element/Element";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import { FreeDrawElement } from "../../../domain/entities/element/FreeDrawElement";
import { LineElement } from "../../../domain/entities/element/LineElement";
import type { LineOrientation } from "../../../domain/entities/element/LineElement";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import type { FieldName } from "../../../domain/entities/element/FieldElement";
import type { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import type { DocumentSummary } from "../../../domain/ports/IDocumentRepository";
import { ElementNotFoundError } from "../../../domain/entities/errors/ElementNotFoundError";
import { buildElement } from "../element-factory/elementFactory";
import type { PlaceableKind } from "../element-factory/elementFactory";
import {
  elementAtCell,
  elementIntersectsRect,
  zIndexForPlacement,
} from "../hit-test/hitTest";
import type {
  CanvasTool,
  SurfacePoint,
  ToolContext,
} from "../tools/CanvasTool";
import { ToolRegistry, createDefaultToolRegistry } from "../tools/ToolRegistry";
import type { EditorKeyAction } from "../keyboard/editorKeyAction";
import { drawCellsOnDocument } from "../../../application/usecases/DrawFreeCharUseCase";
import { eraseCellsOnDocument } from "../../../application/usecases/EraseCellUseCase";
import {
  arrowDirectionForDrag,
  arrowOrientationOf,
  cellSpanRect,
  lineOrientationForDrag,
  lineSizeForOrientation,
} from "./dragGeometry";
import type { CellRect } from "./dragGeometry";

const DEFAULT_GRID_COLS = 80;
const DEFAULT_GRID_ROWS = 24;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

/** Idle time after the last edit before the autosave runs. */
export const AUTOSAVE_IDLE_MS = 2000;
/**
 * Minimum time the "saving" status stays visible. The actual save is nearly
 * instant; holding the indicator briefly reassures the user it happened.
 */
export const AUTOSAVE_SAVING_DISPLAY_MS = 1000;

const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export class NoOpenDocumentError extends Error {
  constructor(operation: string) {
    super(
      `cannot ${operation}: no document is open (expected documentStatus "ready")`,
    );
    this.name = "NoOpenDocumentError";
  }
}

export interface Viewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export type DragState =
  | {
      mode: "move";
      elementIds: readonly string[];
      startCell: Position;
      lastCell: Position;
      originPositions: ReadonlyMap<string, Position>;
    }
  | {
      mode: "resize";
      elementId: string;
      startCell: Position;
      lastCell: Position;
      originPosition: Position;
      originSize: Size;
    }
  | {
      mode: "place";
      kind: PlaceableKind;
      /** Pre-generated so the id is stable across the whole gesture. */
      elementId: string;
      startCell: Position;
      lastCell: Position;
    };

export interface MarqueeState {
  startCell: Position;
  lastCell: Position;
}

export type StrokeState =
  | {
      mode: "draw";
      targetElementId: string | null;
      startCell: Position;
      cells: Map<string, CellChar>;
    }
  | { mode: "erase"; cells: Set<string> };

export interface PanDragState {
  lastClientX: number;
  lastClientY: number;
}

/**
 * Reference geometry captured when a canvas-resize handle drag begins: the
 * paper's screen top-left and the on-screen px per cell (zoom already folded
 * in). Sizing reads off this fixed frame, so the paper growing/shrinking during
 * the drag never feeds back into the cell math.
 */
export interface CanvasResizeDragRef {
  originLeft: number;
  originTop: number;
  cellWidthPx: number;
  cellHeightPx: number;
}

/**
 * Active canvas-resize session. `previewSize` drives a live-resized preview of
 * the whole document; committing applies it via the resize-grid use case,
 * cancelling discards it. Non-null only while the size selector is open.
 */
export interface CanvasResizeState {
  previewSize: GridSize;
  drag: CanvasResizeDragRef | null;
}

export interface PastePreviewState {
  /** Fresh-id clones, normalized so the set's bounding-box top-left is (0,0). */
  elements: readonly Element[];
  /** Cell under the cursor; null until the mouse first enters the canvas. */
  anchorCell: Position | null;
}

export interface ContextMenuState {
  clientX: number;
  clientY: number;
  /** Grid cell where the menu was opened; null when opened from the LayersPanel. */
  cell: Position | null;
  /**
   * What was right-clicked: "element" shows the full menu (copy / paste /
   * duplicate / delete); "empty" (free canvas area) shows only paste.
   */
  target: "element" | "empty";
}

export type DocumentStatus = "idle" | "loading" | "ready" | "missing";

/**
 * Autosave indicator lifecycle: "hidden" until the first edit settles, then
 * "saving" (held for at least {@link AUTOSAVE_SAVING_DISPLAY_MS}) and finally
 * "saved". A failed save returns to "hidden".
 */
export type SaveStatus = "hidden" | "saving" | "saved";

export interface EditorState {
  document: WireframeDocument | null;
  documentStatus: DocumentStatus;
  summaries: DocumentSummary[];
  selectedElementIds: readonly string[];
  activeToolId: string;
  drag: DragState | null;
  marquee: MarqueeState | null;
  stroke: StrokeState | null;
  pencilChar: CellChar;
  panDrag: PanDragState | null;
  viewport: Viewport;
  canUndo: boolean;
  canRedo: boolean;
  /** What the autosave indicator shows; see {@link SaveStatus}. */
  saveStatus: SaveStatus;
  /**
   * Element whose text is being typed right now. While set, single-key
   * shortcuts (Delete, arrows, future V/H tool keys) are suspended so the
   * keystrokes belong to the text field.
   */
  textEditingElementId: string | null;
  /**
   * Set only when text editing is happening inline on the canvas (not in the
   * inspector). Drives `TextEditOverlay`; kept separate from
   * `textEditingElementId` so inspector fields can call `beginTextEditing`
   * without causing the canvas overlay to appear.
   */
  canvasEditingElementId: string | null;
  /**
   * Which text slot of the canvas-edited element is being typed. Non-null only
   * for field elements (input/dropdown), where a double-click targets a
   * specific slot; null means the whole-element text overlay (TextElement).
   */
  canvasEditingField: FieldName | null;
  /**
   * Whether the inspector panel is shown. Selecting or placing an element
   * opens it; the panel's ✕ closes it. The page only renders the panel when
   * this is true AND exactly one element is selected.
   */
  inspectorOpen: boolean;
  /** Internal clipboard — not the OS clipboard. Survives document switches. */
  clipboard: readonly Element[];
  /** Active paste-preview ghost, or null when not in paste mode. */
  pastePreview: PastePreviewState | null;
  /** Active context menu position and source cell, or null when closed. */
  contextMenu: ContextMenuState | null;
  /** Active canvas-resize session (size selector open), or null when idle. */
  canvasResize: CanvasResizeState | null;
}

export interface EditorActions {
  refreshDocuments(): Promise<void>;
  createDocument(name: string): Promise<string>;
  deleteDocument(documentId: string): Promise<void>;
  openDocument(documentId: string): Promise<void>;
  saveCurrentDocument(): Promise<void>;
  selectElement(elementId: string | null): void;
  toggleElementSelection(elementId: string): void;
  replaceSelection(elementIds: readonly string[]): void;
  selectAllElements(): void;
  openInspector(): void;
  closeInspector(): void;
  beginTextEditing(elementId: string): void;
  beginCanvasInlineEditing(elementId: string): void;
  beginCanvasFieldEditing(elementId: string, field: FieldName): void;
  endTextEditing(): void;
  setActiveTool(toolId: string): void;
  listTools(): readonly CanvasTool[];
  placeElement(kind: PlaceableKind, cell: Position): void;
  beginPlacement(kind: PlaceableKind, cell: Position): void;
  moveElementTo(elementId: string, position: Position): void;
  resizeElementTo(elementId: string, size: Size): void;
  nudgeSelection(deltaCol: number, deltaRow: number): void;
  removeSelectedElements(): void;
  changeElementZIndex(elementId: string, zIndex: number): void;
  editElementProps(
    elementId: string,
    props: Readonly<Record<string, unknown>>,
  ): void;
  undo(): void;
  redo(): void;
  applyKeyAction(action: EditorKeyAction): void;
  beginMove(elementIds: readonly string[], cell: Position): void;
  beginResize(elementId: string, cell: Position): void;
  updateDrag(cell: Position): void;
  commitDrag(): void;
  cancelDrag(): void;
  beginMarquee(cell: Position): void;
  updateMarquee(cell: Position): void;
  commitMarquee(additive: boolean): void;
  cancelMarquee(): void;
  beginDrawStroke(cell: Position): void;
  beginEraseStroke(cell: Position): void;
  extendStroke(cell: Position): void;
  commitStroke(): void;
  cancelStroke(): void;
  setPencilChar(char: string): void;
  beginPan(point: SurfacePoint): void;
  updatePan(point: SurfacePoint): void;
  endPan(): void;
  copySelection(): void;
  duplicateSelection(): void;
  beginPastePreview(anchorCell: Position | null): void;
  updatePastePreview(cell: Position): void;
  commitPastePreview(cell: Position): void;
  cancelPastePreview(): void;
  openContextMenu(anchor: ContextMenuState): void;
  closeContextMenu(): void;
  beginCanvasResize(): void;
  beginCanvasResizeDrag(ref: CanvasResizeDragRef): void;
  updateCanvasResizeDrag(point: { clientX: number; clientY: number }): void;
  endCanvasResizeDrag(): void;
  commitCanvasResize(): void;
  cancelCanvasResize(): void;
  pointerDownOnCell(cell: Position, point?: SurfacePoint): void;
  pointerMoveOnCell(cell: Position, point?: SurfacePoint): void;
  pointerUpOnCell(cell: Position, point?: SurfacePoint): void;
  doubleClickOnCell(cell: Position): void;
  composeBuffer(document: WireframeDocument): CharBuffer;
  exportAscii(): string;
  setZoom(zoom: number): void;
  zoomAtPoint(zoom: number, anchorX: number, anchorY: number): void;
  panViewportBy(deltaX: number, deltaY: number): void;
}

export type EditorStoreState = EditorState & EditorActions;
export type EditorStore = StoreApi<EditorStoreState>;

export interface EditorStoreOptions {
  /** Element/document id source; defaults to crypto.randomUUID. */
  generateId?: () => string;
  /** Canvas tool set; defaults to select + box/line/text placement. */
  toolRegistry?: ToolRegistry;
}

const NO_POINT: SurfacePoint = {
  clientX: 0,
  clientY: 0,
  button: 0,
  shiftKey: false,
};

const initialState: EditorState = {
  document: null,
  documentStatus: "idle",
  summaries: [],
  selectedElementIds: [],
  activeToolId: "select",
  drag: null,
  marquee: null,
  stroke: null,
  pencilChar: CellChar.create("*"),
  panDrag: null,
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  canUndo: false,
  canRedo: false,
  saveStatus: "hidden",
  textEditingElementId: null,
  canvasEditingElementId: null,
  canvasEditingField: null,
  inspectorOpen: false,
  clipboard: [],
  pastePreview: null,
  contextMenu: null,
  canvasResize: null,
};

/**
 * The single bridge between React and the application layer: components read
 * state through selectors and mutate only via these actions, which delegate to
 * the injected use cases. Drag gestures keep a transient preview in `drag` and
 * commit once on pointer up, so one gesture costs one undo snapshot.
 *
 * @example
 * const store = createEditorStore(createContainer());
 * store.getState().placeElement("box", Position.create(2, 1));
 */
export function createEditorStore(
  container: AppContainer,
  options: EditorStoreOptions = {},
): EditorStore {
  const generateId = options.generateId ?? (() => crypto.randomUUID());
  const toolRegistry = options.toolRegistry ?? createDefaultToolRegistry();

  return createStore<EditorStoreState>()((set, get) => {
    const requireDocument = (operation: string): WireframeDocument => {
      const { document } = get();
      if (document === null) {
        throw new NoOpenDocumentError(operation);
      }
      return document;
    };

    let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

    const cancelPendingAutosave = (): void => {
      if (autosaveTimer !== null) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }
    };

    /**
     * Saves the open document while holding "saving" visible for at least
     * {@link AUTOSAVE_SAVING_DISPLAY_MS}, then flips the indicator to "saved".
     */
    const runAutosave = async (): Promise<void> => {
      set({ saveStatus: "saving" });
      const minimumDisplay = new Promise<void>((resolve) => {
        setTimeout(resolve, AUTOSAVE_SAVING_DISPLAY_MS);
      });
      try {
        await Promise.all([get().saveCurrentDocument(), minimumDisplay]);
        set({ saveStatus: "saved" });
      } catch {
        set({ saveStatus: "hidden" });
      }
    };

    /** (Re)starts the idle countdown; every edit pushes the save back 5s. */
    const scheduleAutosave = (): void => {
      cancelPendingAutosave();
      autosaveTimer = setTimeout(() => {
        autosaveTimer = null;
        void runAutosave();
      }, AUTOSAVE_IDLE_MS);
    };

    /**
     * Applies a mutated document, refreshes the undo/redo button state and
     * restarts the autosave idle countdown.
     */
    const commitDocument = (document: WireframeDocument): void => {
      set({
        document,
        canUndo: container.history.canUndo,
        canRedo: container.history.canRedo,
      });
      scheduleAutosave();
    };

    /**
     * Adds the element built by a placement drag once, on pointer up, so a
     * click-drag-to-size gesture still costs a single undo snapshot. Replays
     * the selection/inspector/text-editing effects of {@link placeElement}.
     */
    const commitPlacementDrag = (
      drag: Extract<DragState, { mode: "place" }>,
    ): void => {
      const document = requireDocument("commit a placement drag");
      const built = placedElement(drag);
      const element = built.withZIndex(
        zIndexForPlacement(document, built.position, built.size),
      );
      set({ drag: null });
      commitDocument(container.addElement.execute({ document, element }));
      set({
        selectedElementIds: [element.id],
        textEditingElementId: drag.kind === "text" ? element.id : null,
        canvasEditingElementId: drag.kind === "text" ? element.id : null,
        canvasEditingField: null,
        inspectorOpen: true,
      });
    };

    const toolContext = (): ToolContext => ({
      elementAt: (cell) =>
        elementAtCell(requireDocument("hit-test a cell"), cell),
      select: (elementId) => get().selectElement(elementId),
      selectionIds: () => get().selectedElementIds,
      toggleSelect: (elementId) => get().toggleElementSelection(elementId),
      beginPlacement: (kind, cell) => get().beginPlacement(kind, cell),
      beginMove: (elementIds, cell) => get().beginMove(elementIds, cell),
      updateDrag: (cell) => get().updateDrag(cell),
      commitDrag: () => get().commitDrag(),
      beginDrawStroke: (cell) => get().beginDrawStroke(cell),
      beginEraseStroke: (cell) => get().beginEraseStroke(cell),
      extendStroke: (cell) => get().extendStroke(cell),
      commitStroke: () => get().commitStroke(),
      beginPan: (point) => get().beginPan(point),
      updatePan: (point) => get().updatePan(point),
      endPan: () => get().endPan(),
      beginCanvasInlineEditing: (elementId) =>
        get().beginCanvasInlineEditing(elementId),
      beginCanvasFieldEditing: (elementId, field) =>
        get().beginCanvasFieldEditing(elementId, field),
      beginMarquee: (cell) => get().beginMarquee(cell),
      updateMarquee: (cell) => get().updateMarquee(cell),
      commitMarquee: (additive) => get().commitMarquee(additive),
    });

    return {
      ...initialState,

      refreshDocuments: async () => {
        set({ summaries: await container.repository.list() });
      },

      createDocument: async (name) => {
        const document = WireframeDocument.create({
          id: generateId(),
          name,
          gridSize: GridSize.create(DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS),
        });
        await container.saveDocument.execute({ document });
        await get().refreshDocuments();
        return document.id;
      },

      deleteDocument: async (documentId) => {
        await container.repository.delete(documentId);
        await get().refreshDocuments();
      },

      openDocument: async (documentId) => {
        cancelPendingAutosave();
        set({
          documentStatus: "loading",
          document: null,
          saveStatus: "hidden",
          selectedElementIds: [],
          drag: null,
          marquee: null,
          stroke: null,
          panDrag: null,
          textEditingElementId: null,
          canvasEditingElementId: null,
          canvasEditingField: null,
          inspectorOpen: false,
          pastePreview: null,
          contextMenu: null,
        });
        const document = await container.loadDocument.execute({
          id: documentId,
        });
        container.history.clear();
        set({
          document,
          documentStatus: document === null ? "missing" : "ready",
          canUndo: false,
          canRedo: false,
        });
      },

      saveCurrentDocument: async () => {
        await container.saveDocument.execute({
          document: requireDocument("save the document"),
        });
      },

      // Deliberately does NOT open the inspector: selection happens on
      // pointer down, but the panel only opens when the gesture ends
      // (commitDrag) or via an explicit openInspector call.
      selectElement: (elementId) => {
        const { textEditingElementId, canvasEditingElementId } = get();
        const newIds = elementId === null ? [] : [elementId];
        set({
          selectedElementIds: newIds,
          textEditingElementId:
            textEditingElementId === elementId ? elementId : null,
          canvasEditingElementId:
            canvasEditingElementId === elementId ? elementId : null,
          canvasEditingField:
            canvasEditingElementId === elementId
              ? get().canvasEditingField
              : null,
          inspectorOpen: elementId === null ? false : get().inspectorOpen,
        });
      },

      toggleElementSelection: (elementId) => {
        const { selectedElementIds } = get();
        const newIds = selectedElementIds.includes(elementId)
          ? selectedElementIds.filter((id) => id !== elementId)
          : [...selectedElementIds, elementId];
        set({
          selectedElementIds: newIds,
          textEditingElementId: null,
          canvasEditingElementId: null,
          canvasEditingField: null,
          inspectorOpen: newIds.length !== 1 ? false : get().inspectorOpen,
        });
      },

      replaceSelection: (elementIds) => {
        const unique = [...new Set(elementIds)];
        set({
          selectedElementIds: unique,
          textEditingElementId: null,
          canvasEditingElementId: null,
          canvasEditingField: null,
          inspectorOpen: false,
        });
      },

      selectAllElements: () => {
        const document = requireDocument("select all elements");
        get().replaceSelection(document.elements.map((element) => element.id));
      },

      openInspector: () => {
        set({ inspectorOpen: true });
      },

      closeInspector: () => {
        set({ inspectorOpen: false });
      },

      beginTextEditing: (elementId) => {
        // Inspector-driven editing: clear canvas overlay so they don't coexist.
        set({
          textEditingElementId: elementId,
          canvasEditingElementId: null,
          canvasEditingField: null,
        });
      },

      beginCanvasInlineEditing: (elementId) => {
        set({
          textEditingElementId: elementId,
          canvasEditingElementId: elementId,
          canvasEditingField: null,
        });
      },

      beginCanvasFieldEditing: (elementId, field) => {
        set({
          textEditingElementId: elementId,
          canvasEditingElementId: elementId,
          canvasEditingField: field,
        });
      },

      endTextEditing: () => {
        set({
          textEditingElementId: null,
          canvasEditingElementId: null,
          canvasEditingField: null,
        });
      },

      setActiveTool: (toolId) => {
        toolRegistry.get(toolId); // fail fast on unknown ids
        set({
          activeToolId: toolId,
          drag: null,
          marquee: null,
          stroke: null,
          panDrag: null,
          pastePreview: null,
          contextMenu: null,
        });
      },

      listTools: () => toolRegistry.list(),

      placeElement: (kind, cell) => {
        const document = requireDocument("place an element");
        const built = buildElement(kind, {
          id: generateId(),
          position: cell,
          zIndex: 0,
        });
        const element = built.withZIndex(
          zIndexForPlacement(document, built.position, built.size),
        );
        commitDocument(container.addElement.execute({ document, element }));
        set({
          selectedElementIds: [element.id],
          textEditingElementId: kind === "text" ? element.id : null,
          canvasEditingElementId: kind === "text" ? element.id : null,
          canvasEditingField: null,
          inspectorOpen: true,
        });
      },

      // Anchors a placement drag on the pressed cell. Nothing is committed
      // until pointer up (commitDrag → commitPlacementDrag); until then the
      // element exists only as a preview via previewedDocument.
      beginPlacement: (kind, cell) => {
        requireDocument("start a placement drag");
        set({
          drag: {
            mode: "place",
            kind,
            elementId: generateId(),
            startCell: cell,
            lastCell: cell,
          },
        });
      },

      moveElementTo: (elementId, position) => {
        const document = requireDocument("move an element");
        commitDocument(
          container.moveElement.execute({ document, elementId, position }),
        );
      },

      resizeElementTo: (elementId, size) => {
        const document = requireDocument("resize an element");
        commitDocument(
          container.resizeElement.execute({ document, elementId, size }),
        );
      },

      nudgeSelection: (deltaCol, deltaRow) => {
        const { selectedElementIds } = get();
        if (selectedElementIds.length === 0) {
          return;
        }
        const document = requireDocument("nudge the selection");
        const moves = selectedElementIds.map((id) => {
          const element = requireElement(document, id);
          return {
            elementId: id,
            position: element.position.translate(deltaCol, deltaRow),
          };
        });
        commitDocument(container.moveElements.execute({ document, moves }));
      },

      removeSelectedElements: () => {
        const { selectedElementIds } = get();
        if (selectedElementIds.length === 0) {
          return;
        }
        const document = requireDocument("remove the selection");
        commitDocument(
          container.removeElements.execute({
            document,
            elementIds: selectedElementIds,
          }),
        );
        set({ selectedElementIds: [] });
      },

      changeElementZIndex: (elementId, zIndex) => {
        const document = requireDocument("reorder an element");
        commitDocument(
          container.reorderLayer.execute({ document, elementId, zIndex }),
        );
      },

      editElementProps: (elementId, props) => {
        const document = requireDocument("edit element props");
        commitDocument(
          container.editElementProps.execute({ document, elementId, props }),
        );
      },

      undo: () => {
        const document = requireDocument("undo");
        commitDocument(container.undo.execute({ document }));
      },

      redo: () => {
        const document = requireDocument("redo");
        commitDocument(container.redo.execute({ document }));
      },

      applyKeyAction: (action) => {
        if (
          get().textEditingElementId !== null &&
          suspendedDuringTextEditing(action)
        ) {
          return;
        }
        if (action.type === "undo") {
          get().undo();
          return;
        }
        if (action.type === "redo") {
          get().redo();
          return;
        }
        if (action.type === "cancel") {
          cancelActiveInteraction(get);
          return;
        }
        if (action.type === "copy") {
          get().copySelection();
          return;
        }
        if (action.type === "paste") {
          get().beginPastePreview(null);
          return;
        }
        if (action.type === "duplicate") {
          get().duplicateSelection();
          return;
        }
        if (action.type === "select-all") {
          get().selectAllElements();
          return;
        }
        if (action.type === "remove-selected") {
          if (get().pastePreview !== null) {
            get().cancelPastePreview();
            return;
          }
          get().removeSelectedElements();
          return;
        }
        get().nudgeSelection(action.deltaCol, action.deltaRow);
      },

      beginMove: (elementIds, cell) => {
        const doc = requireDocument("start a move drag");
        const originPositions = new Map(
          elementIds.map((id) => [id, requireElement(doc, id).position]),
        );
        set({
          drag: {
            mode: "move",
            elementIds,
            startCell: cell,
            lastCell: cell,
            originPositions,
          },
        });
      },

      beginResize: (elementId, cell) => {
        const element = requireElement(
          requireDocument("start a resize drag"),
          elementId,
        );
        set({
          drag: {
            mode: "resize",
            elementId,
            startCell: cell,
            lastCell: cell,
            originPosition: element.position,
            originSize: element.size,
          },
        });
      },

      updateDrag: (cell) => {
        const { drag } = get();
        if (drag === null) {
          return;
        }
        // Pointer moves fire per pixel; only a cell change alters the preview,
        // so same-cell moves must not publish new state (and re-render).
        if (cell.equals(drag.lastCell)) {
          return;
        }
        set({ drag: { ...drag, lastCell: cell } });
      },

      commitDrag: () => {
        const { drag, selectedElementIds } = get();
        if (drag === null) {
          return;
        }
        // Placement commits even on a plain click (start === last), so it must
        // run before the "returned to start" early-return below.
        if (drag.mode === "place") {
          commitPlacementDrag(drag);
          return;
        }
        // Open the inspector only for a single-element selection; multi-move
        // leaves the inspector closed so it doesn't pop open unexpectedly.
        set({ drag: null, inspectorOpen: selectedElementIds.length === 1 });
        if (drag.lastCell.equals(drag.startCell)) {
          return;
        }
        const document = requireDocument("commit a drag");
        commitDocument(executeDrag(container, document, drag));
      },

      cancelDrag: () => {
        set({ drag: null });
      },

      beginMarquee: (cell) => {
        set({ marquee: { startCell: cell, lastCell: cell } });
      },

      updateMarquee: (cell) => {
        const { marquee } = get();
        if (marquee === null) {
          return;
        }
        // Same-cell moves don't change the marquee rect; skip the state update
        // so the MarqueeOverlay only re-renders when the rect actually grows.
        if (cell.equals(marquee.lastCell)) {
          return;
        }
        set({ marquee: { ...marquee, lastCell: cell } });
      },

      commitMarquee: (additive) => {
        const { marquee } = get();
        if (marquee === null) {
          return;
        }
        set({ marquee: null });
        const document = get().document;
        if (document === null) {
          return;
        }
        const rect = marqueeRect(marquee);
        const hits = document.elements
          .filter((el) => elementIntersectsRect(el, rect.position, rect.size))
          .map((el) => el.id);

        // A 1-cell marquee on empty space with no shift = clear selection
        if (
          hits.length === 0 &&
          rect.size.width === 1 &&
          rect.size.height === 1 &&
          !additive
        ) {
          get().selectElement(null);
          return;
        }
        const { selectedElementIds } = get();
        const newIds = additive
          ? [...new Set([...selectedElementIds, ...hits])]
          : hits;
        get().replaceSelection(newIds);
      },

      cancelMarquee: () => {
        set({ marquee: null });
      },

      beginDrawStroke: (cell) => {
        requireDocument("begin draw stroke");
        const { pencilChar } = get();
        const selected = selectedElementOf(get());
        const targetElementId =
          selected instanceof FreeDrawElement ? selected.id : null;
        const key = `${cell.col},${cell.row}`;
        set({
          stroke: {
            mode: "draw",
            targetElementId,
            startCell: cell,
            cells: new Map([[key, pencilChar]]),
          },
        });
      },

      beginEraseStroke: (cell) => {
        requireDocument("begin erase stroke");
        const key = `${cell.col},${cell.row}`;
        set({ stroke: { mode: "erase", cells: new Set([key]) } });
      },

      extendStroke: (cell) => {
        const { stroke, pencilChar } = get();
        if (stroke === null) return;
        const key = `${cell.col},${cell.row}`;
        if (stroke.mode === "draw") {
          // Re-stamping the same char on the same cell changes nothing;
          // skip so moving inside one cell doesn't recompose the canvas.
          if (stroke.cells.get(key)?.equals(pencilChar) === true) {
            return;
          }
          const newCells = new Map(stroke.cells);
          newCells.set(key, pencilChar);
          set({ stroke: { ...stroke, cells: newCells } });
        } else {
          if (stroke.cells.has(key)) {
            return;
          }
          const newCells = new Set(stroke.cells);
          newCells.add(key);
          set({ stroke: { ...stroke, cells: newCells } });
        }
      },

      commitStroke: () => {
        const { stroke } = get();
        if (stroke === null) return;
        set({ stroke: null });
        if (stroke.mode === "draw") {
          if (stroke.cells.size === 0) return;
          const document = requireDocument("commit draw stroke");
          if (stroke.targetElementId === null) {
            const id = generateId();
            let el = FreeDrawElement.create({
              id,
              position: stroke.startCell,
              layerId: null,
              zIndex: zIndexForPlacement(
                document,
                stroke.startCell,
                Size.create(1, 1),
              ),
              cells: new Map(),
            });
            for (const [key, char] of stroke.cells) {
              el = el.withCharAt(parseCellKeyToPosition(key), char);
            }
            commitDocument(
              container.addElement.execute({ document, element: el }),
            );
            set({ selectedElementIds: [el.id], inspectorOpen: true });
          } else {
            const cells = [...stroke.cells.entries()].map(([key, char]) => ({
              position: parseCellKeyToPosition(key),
              char,
            }));
            commitDocument(
              container.drawFreeChar.execute({
                document,
                elementId: stroke.targetElementId,
                cells,
              }),
            );
          }
        } else {
          if (stroke.cells.size === 0) return;
          const document = requireDocument("commit erase stroke");
          const cells = [...stroke.cells].map(parseCellKeyToPosition);
          commitDocument(container.eraseCell.execute({ document, cells }));
        }
      },

      cancelStroke: () => {
        set({ stroke: null });
      },

      setPencilChar: (char) => {
        set({ pencilChar: CellChar.create(char) });
      },

      beginPan: (point) => {
        set({
          panDrag: { lastClientX: point.clientX, lastClientY: point.clientY },
        });
      },

      updatePan: (point) => {
        const { panDrag } = get();
        if (panDrag === null) return;
        get().panViewportBy(
          point.clientX - panDrag.lastClientX,
          point.clientY - panDrag.lastClientY,
        );
        set({
          panDrag: { lastClientX: point.clientX, lastClientY: point.clientY },
        });
      },

      endPan: () => {
        set({ panDrag: null });
      },

      copySelection: () => {
        const elements = selectedElementsOf(get());
        if (elements.length === 0) return;
        set({ clipboard: elements });
      },

      duplicateSelection: () => {
        const elements = selectedElementsOf(get());
        if (elements.length === 0) return;
        const document = requireDocument("duplicate the selection");
        const clones = elements.map((el) =>
          el.withId(generateId()).translate(1, 1),
        );
        commitDocument(
          container.addElements.execute({ document, elements: clones }),
        );
        set({ selectedElementIds: clones.map((el) => el.id) });
      },

      beginPastePreview: (anchorCell) => {
        const { clipboard } = get();
        if (clipboard.length === 0) return;
        requireDocument("begin paste preview");
        set({
          pastePreview: {
            elements: normalizedClones(clipboard, generateId),
            anchorCell,
          },
          contextMenu: null,
        });
      },

      updatePastePreview: (cell) => {
        const { pastePreview } = get();
        if (pastePreview === null) return;
        // The ghost only moves when the anchor cell changes; same-cell moves
        // would otherwise rebuild the preview document on every pixel.
        if (
          pastePreview.anchorCell !== null &&
          cell.equals(pastePreview.anchorCell)
        ) {
          return;
        }
        set({ pastePreview: { ...pastePreview, anchorCell: cell } });
      },

      commitPastePreview: (cell) => {
        const { pastePreview } = get();
        if (pastePreview === null) return;
        const document = requireDocument("commit paste preview");
        const placed = pastedElementsAt(document, pastePreview.elements, cell);
        commitDocument(
          container.addElements.execute({ document, elements: placed }),
        );
        set({
          pastePreview: null,
          selectedElementIds: placed.map((el) => el.id),
          inspectorOpen: false,
        });
      },

      cancelPastePreview: () => {
        set({ pastePreview: null });
      },

      openContextMenu: (anchor) => {
        set({ contextMenu: anchor });
      },

      closeContextMenu: () => {
        set({ contextMenu: null });
      },

      // Opens the size selector: clears every other interaction so only the
      // resize overlay is live, and seeds the preview at the current grid size.
      beginCanvasResize: () => {
        const document = requireDocument("resize the canvas");
        set({
          canvasResize: { previewSize: document.gridSize, drag: null },
          selectedElementIds: [],
          inspectorOpen: false,
          drag: null,
          marquee: null,
          stroke: null,
          pastePreview: null,
          contextMenu: null,
        });
      },

      beginCanvasResizeDrag: (ref) => {
        const { canvasResize } = get();
        if (canvasResize === null) {
          return;
        }
        set({ canvasResize: { ...canvasResize, drag: ref } });
      },

      updateCanvasResizeDrag: (point) => {
        const { canvasResize } = get();
        if (canvasResize === null || canvasResize.drag === null) {
          return;
        }
        const previewSize = gridSizeFromResizeDrag(canvasResize.drag, point);
        // Same-size moves must not publish new state (and recompose the paper).
        if (previewSize.equals(canvasResize.previewSize)) {
          return;
        }
        set({ canvasResize: { ...canvasResize, previewSize } });
      },

      endCanvasResizeDrag: () => {
        const { canvasResize } = get();
        if (canvasResize === null) {
          return;
        }
        set({ canvasResize: { ...canvasResize, drag: null } });
      },

      commitCanvasResize: () => {
        const { canvasResize } = get();
        if (canvasResize === null) {
          return;
        }
        set({ canvasResize: null });
        // beginCanvasResize requires an open document, so one is present here.
        const document = requireDocument("commit a canvas resize");
        if (canvasResize.previewSize.equals(document.gridSize)) {
          return;
        }
        commitDocument(
          container.resizeGrid.execute({
            document,
            gridSize: canvasResize.previewSize,
          }),
        );
      },

      cancelCanvasResize: () => {
        set({ canvasResize: null });
      },

      pointerDownOnCell: (cell, point = NO_POINT) => {
        if (get().contextMenu !== null) get().closeContextMenu();
        const { pastePreview } = get();
        if (pastePreview !== null) {
          if (point.button === 0) get().commitPastePreview(cell);
          else get().cancelPastePreview();
          return;
        }
        if (point.button === 2) {
          const { document: doc } = get();
          const hit = doc !== null ? elementAtCell(doc, cell) : null;
          if (hit !== null && !get().selectedElementIds.includes(hit.id)) {
            get().selectElement(hit.id);
          }
          get().openContextMenu({
            clientX: point.clientX,
            clientY: point.clientY,
            cell,
            target: hit !== null ? "element" : "empty",
          });
          return;
        }
        activeTool(toolRegistry, get()).onCellPointerDown(
          toolContext(),
          cell,
          point,
        );
      },

      pointerMoveOnCell: (cell, point = NO_POINT) => {
        if (get().pastePreview !== null) {
          get().updatePastePreview(cell);
          return;
        }
        activeTool(toolRegistry, get()).onCellPointerMove(
          toolContext(),
          cell,
          point,
        );
      },

      pointerUpOnCell: (cell, point = NO_POINT) => {
        activeTool(toolRegistry, get()).onCellPointerUp(
          toolContext(),
          cell,
          point,
        );
      },

      doubleClickOnCell: (cell) => {
        activeTool(toolRegistry, get()).onCellDoubleClick?.(
          toolContext(),
          cell,
        );
      },

      // Takes the document as a parameter (usually a drag preview built with
      // previewedDocument) so callers control what is rasterized while still
      // going through the store — React never touches the use case itself.
      composeBuffer: (document) => {
        return container.composeAscii.execute({ document });
      },

      exportAscii: () => {
        return container.exportAscii.execute({
          document: requireDocument("export ASCII"),
        });
      },

      setZoom: (zoom) => {
        set({ viewport: { ...get().viewport, zoom: clampZoom(zoom) } });
      },

      // Zoom while keeping the content-local anchor (px from the content's
      // top-left, unscaled) pinned under the same screen point. With the
      // transform `translate(offset) scale(zoom)`, a point maps to
      // `offset + anchor * zoom`; holding the screen point fixed across a
      // zoom change of `dz` requires shifting the offset by `-anchor * dz`.
      zoomAtPoint: (zoom, anchorX, anchorY) => {
        const viewport = get().viewport;
        const nextZoom = clampZoom(zoom);
        const dz = nextZoom - viewport.zoom;
        set({
          viewport: {
            zoom: nextZoom,
            offsetX: viewport.offsetX - anchorX * dz,
            offsetY: viewport.offsetY - anchorY * dz,
          },
        });
      },

      panViewportBy: (deltaX, deltaY) => {
        const viewport = get().viewport;
        set({
          viewport: {
            ...viewport,
            offsetX: viewport.offsetX + deltaX,
            offsetY: viewport.offsetY + deltaY,
          },
        });
      },
    };
  });
}

/**
 * Document as it should be rendered mid-gesture. Uses the domain mutators
 * directly (not use cases) on purpose: the preview is ephemeral render state;
 * the gesture is committed once via a use case on pointer up, keeping the
 * history at exactly one snapshot per gesture.
 *
 * @example
 * const preview = previewedDocument(document, drag, stroke);
 */
export function previewedDocument(
  document: WireframeDocument,
  drag: DragState | null,
  stroke: StrokeState | null = null,
  pastePreview: PastePreviewState | null = null,
): WireframeDocument {
  const withDrag = applyDragPreview(document, drag);
  const withStroke = applyStrokePreview(withDrag, stroke);
  return applyPastePreviewGhost(withStroke, pastePreview);
}

/** Selected element instance, or null when not exactly one element is selected. */
export function selectedElementOf(
  state: Pick<EditorState, "document" | "selectedElementIds">,
): Element | null {
  if (state.document === null || state.selectedElementIds.length !== 1) {
    return null;
  }
  return state.document.getElement(state.selectedElementIds[0]) ?? null;
}

/** All currently selected element instances (filters out stale ids). */
export function selectedElementsOf(
  state: Pick<EditorState, "document" | "selectedElementIds">,
): Element[] {
  if (state.document === null) {
    return [];
  }
  return state.selectedElementIds
    .map((id) => state.document!.getElement(id))
    .filter((el): el is Element => el !== undefined);
}

/**
 * Normalises a marquee state into a { position, size } rectangle.
 * Handles inverted drags (last < start) by taking min/max.
 *
 * @example
 * const rect = marqueeRect({ startCell: pos(5,3), lastCell: pos(2,1) });
 * // => { position: pos(2,1), size: size(4, 3) }
 */
export function marqueeRect(marquee: MarqueeState): CellRect {
  return cellSpanRect(marquee.startCell, marquee.lastCell);
}

function applyDragPreview(
  document: WireframeDocument,
  drag: DragState | null,
): WireframeDocument {
  if (drag === null) return document;
  if (drag.mode === "place") {
    try {
      return document.addElement(placedElement(drag));
    } catch {
      return document;
    }
  }
  if (drag.mode === "move") {
    const deltaCol = drag.lastCell.col - drag.startCell.col;
    const deltaRow = drag.lastCell.row - drag.startCell.row;
    return drag.elementIds.reduce((doc, id) => {
      const origin = drag.originPositions.get(id);
      if (origin === undefined) return doc;
      return doc.moveElement(id, origin.translate(deltaCol, deltaRow));
    }, document);
  }
  return resizedPreview(document, drag);
}

/** Resize preview, flipping a line's orientation mid-gesture when it crosses the threshold. */
function resizedPreview(
  document: WireframeDocument,
  drag: Extract<DragState, { mode: "resize" }>,
): WireframeDocument {
  const element = document.getElement(drag.elementId);
  if (element === undefined) return document;
  const outcome = resizeOutcome(element, drag);
  const resized = document.resizeElement(drag.elementId, outcome.size);
  if (outcome.props === undefined) return resized;
  return resized.replaceElement(
    resized.getElement(drag.elementId)!.withProps(outcome.props),
  );
}

function applyStrokePreview(
  document: WireframeDocument,
  stroke: StrokeState | null,
): WireframeDocument {
  if (stroke === null || stroke.cells.size === 0) return document;
  if (stroke.mode === "draw") {
    const cells = [...stroke.cells.entries()].map(([key, char]) => ({
      position: parseCellKeyToPosition(key),
      char,
    }));
    if (stroke.targetElementId !== null) {
      try {
        return drawCellsOnDocument(document, stroke.targetElementId, cells);
      } catch {
        return document;
      }
    }
    // No target yet: show a temporary preview element.
    let el = FreeDrawElement.create({
      id: "__preview__",
      position: stroke.startCell,
      layerId: null,
      zIndex: 0,
      cells: new Map(),
    });
    for (const { position, char } of cells) {
      el = el.withCharAt(position, char);
    }
    try {
      return document.addElement(el);
    } catch {
      return document;
    }
  }
  const cells = [...stroke.cells].map(parseCellKeyToPosition);
  return eraseCellsOnDocument(document, cells);
}

function activeTool(registry: ToolRegistry, state: EditorState): CanvasTool {
  return registry.get(state.activeToolId);
}

function requireElement(
  document: WireframeDocument,
  elementId: string,
): Element {
  const element = document.getElement(elementId);
  if (element === undefined) {
    throw new ElementNotFoundError(elementId);
  }
  return element;
}

/** Shortcuts suspended while a text field has focus (undo/redo stay live). */
function suspendedDuringTextEditing(action: EditorKeyAction): boolean {
  return (
    action.type === "remove-selected" ||
    action.type === "nudge" ||
    action.type === "cancel" ||
    action.type === "copy" ||
    action.type === "paste" ||
    action.type === "duplicate" ||
    action.type === "select-all"
  );
}

/** Cancels the highest-priority active interaction (contextMenu → pastePreview → drag → marquee → stroke). */
function cancelActiveInteraction(get: () => EditorStoreState): void {
  if (get().contextMenu !== null) {
    get().closeContextMenu();
    return;
  }
  if (get().pastePreview !== null) {
    get().cancelPastePreview();
    return;
  }
  if (get().drag !== null) {
    get().cancelDrag();
    return;
  }
  if (get().marquee !== null) {
    get().cancelMarquee();
    return;
  }
  if (get().stroke !== null) {
    get().cancelStroke();
  }
}

/** Normalizes clones: subtracts the top-left of the bounding box and assigns fresh ids. */
function normalizedClones(
  elements: readonly Element[],
  generateId: () => string,
): readonly Element[] {
  const minCol = Math.min(...elements.map((el) => el.position.col));
  const minRow = Math.min(...elements.map((el) => el.position.row));
  return elements.map((el) =>
    el.withId(generateId()).translate(-minCol, -minRow),
  );
}

/** Bounding-box size of a normalized set of elements. */
function clipboardBoundingSize(elements: readonly Element[]): Size {
  const maxCol = Math.max(
    ...elements.map((el) => el.position.col + el.size.width),
  );
  const maxRow = Math.max(
    ...elements.map((el) => el.position.row + el.size.height),
  );
  return Size.create(maxCol, maxRow);
}

/** Translates normalized elements to the anchor and elevates z-indexes. */
function pastedElementsAt(
  document: WireframeDocument,
  normalized: readonly Element[],
  anchor: Position,
): readonly Element[] {
  const bboxSize = clipboardBoundingSize(normalized);
  const minZ = Math.min(...normalized.map((el) => el.zIndex));
  const lift = zIndexForPlacement(document, anchor, bboxSize) - minZ;
  return normalized.map((el) =>
    el.translate(anchor.col, anchor.row).withZIndex(el.zIndex + lift),
  );
}

/** Renders the paste-preview ghost into the document. */
function applyPastePreviewGhost(
  document: WireframeDocument,
  pastePreview: PastePreviewState | null,
): WireframeDocument {
  if (pastePreview === null || pastePreview.anchorCell === null)
    return document;
  const anchor = pastePreview.anchorCell;
  return pastePreview.elements.reduce(
    (doc, el) => doc.addElement(el.translate(anchor.col, anchor.row)),
    document,
  );
}

/** Resize never lets the mouse shrink an element below 1×1. */
function dragTargetSize(drag: Extract<DragState, { mode: "resize" }>): Size {
  return Size.create(
    Math.max(1, drag.originSize.width + drag.lastCell.col - drag.startCell.col),
    Math.max(
      1,
      drag.originSize.height + drag.lastCell.row - drag.startCell.row,
    ),
  );
}

interface ResizeOutcome {
  size: Size;
  /** Set only when the gesture flips a line's orientation. */
  props?: Readonly<Record<string, unknown>>;
}

/**
 * Size (and optional prop patch) a resize drag produces. Lines and arrows flip
 * their axis when the perpendicular travel wins; an arrow that flips also gets
 * a new head direction. Every other kind just grows to the drag target.
 */
function resizeOutcome(
  element: Element,
  drag: Extract<DragState, { mode: "resize" }>,
): ResizeOutcome {
  const target = dragTargetSize(drag);
  if (element instanceof LineElement) {
    const shape = lineDragShape(element.orientation, target, drag);
    return shape.orientation === element.orientation
      ? { size: shape.size }
      : { size: shape.size, props: { orientation: shape.orientation } };
  }
  if (element instanceof ArrowElement) {
    const orientation = arrowOrientationOf(element.direction);
    const shape = lineDragShape(orientation, target, drag);
    if (shape.orientation === orientation) {
      return { size: shape.size };
    }
    const direction = arrowDirectionForDrag(
      shape.orientation,
      drag.lastCell.col - drag.startCell.col,
      drag.lastCell.row - drag.startCell.row,
    );
    return { size: shape.size, props: { direction } };
  }
  return { size: target };
}

/**
 * The element a placement drag produces: default size on a plain click, else
 * the rect spanned by the gesture — in any direction, so dragging up/left of
 * the anchor grows the element toward the mouse instead of clamping at 1×1.
 */
function placedElement(drag: Extract<DragState, { mode: "place" }>): Element {
  const element = buildElement(drag.kind, {
    id: drag.elementId,
    position: drag.startCell,
    zIndex: 0,
  });
  if (drag.lastCell.equals(drag.startCell)) {
    return element;
  }
  const rect = cellSpanRect(drag.startCell, drag.lastCell);
  if (element instanceof LineElement) {
    const shape = lineDragShape(element.orientation, rect.size, drag);
    return element
      .withOrientation(shape.orientation)
      .moveTo(axisAnchoredPosition(shape.orientation, drag.startCell, rect))
      .resize(shape.size);
  }
  if (element instanceof ArrowElement) {
    return placedArrow(element, drag, rect);
  }
  return element.moveTo(rect.position).resize(rect.size);
}

/** Arrow placement: axis flips like a line; the head follows the mouse. */
function placedArrow(
  element: ArrowElement,
  drag: Extract<DragState, { mode: "place" }>,
  rect: CellRect,
): Element {
  const shape = lineDragShape(
    arrowOrientationOf(element.direction),
    rect.size,
    drag,
  );
  const direction = arrowDirectionForDrag(
    shape.orientation,
    drag.lastCell.col - drag.startCell.col,
    drag.lastCell.row - drag.startCell.row,
  );
  return element
    .withDirection(direction)
    .moveTo(axisAnchoredPosition(shape.orientation, drag.startCell, rect))
    .resize(shape.size);
}

/**
 * Where a placed line/arrow starts: it spans the rect along its axis but stays
 * pinned to the anchor cell on the perpendicular axis, so a diagonal drag
 * doesn't jump the element off the row/column where the gesture began.
 */
function axisAnchoredPosition(
  orientation: LineOrientation,
  startCell: Position,
  rect: CellRect,
): Position {
  return orientation === "h"
    ? Position.create(rect.position.col, startCell.row)
    : Position.create(startCell.col, rect.position.row);
}

/**
 * Orientation + canonical line size for a resize/placement drag's target box.
 * Placement flips on travel in any direction (absolute deltas); resize keeps
 * the bottom-right-handle semantics where negative deltas never flip.
 */
function lineDragShape(
  current: LineOrientation,
  target: Size,
  drag: Extract<DragState, { mode: "resize" | "place" }>,
): { orientation: LineOrientation; size: Size } {
  const rawCol = drag.lastCell.col - drag.startCell.col;
  const rawRow = drag.lastCell.row - drag.startCell.row;
  const deltaCol = drag.mode === "place" ? Math.abs(rawCol) : rawCol;
  const deltaRow = drag.mode === "place" ? Math.abs(rawRow) : rawRow;
  const orientation = lineOrientationForDrag(current, deltaCol, deltaRow);
  return { orientation, size: lineSizeForOrientation(orientation, target) };
}

function executeDrag(
  container: AppContainer,
  document: WireframeDocument,
  // "place" is committed separately (commitPlacementDrag), never here.
  drag: Exclude<DragState, { mode: "place" }>,
): WireframeDocument {
  if (drag.mode === "move") {
    const deltaCol = drag.lastCell.col - drag.startCell.col;
    const deltaRow = drag.lastCell.row - drag.startCell.row;
    const moves = drag.elementIds.map((id) => {
      const origin = drag.originPositions.get(id)!;
      return { elementId: id, position: origin.translate(deltaCol, deltaRow) };
    });
    return container.moveElements.execute({ document, moves });
  }
  const element = requireElement(document, drag.elementId);
  const outcome = resizeOutcome(element, drag);
  return container.resizeElement.execute({
    document,
    elementId: drag.elementId,
    size: outcome.size,
    props: outcome.props,
  });
}

/**
 * Grid size a canvas-resize handle drag produces: the pointer position measured
 * against the drag's fixed reference frame, rounded to whole cells and floored
 * at 1×1 (an empty grid is not representable).
 */
function gridSizeFromResizeDrag(
  drag: CanvasResizeDragRef,
  point: { clientX: number; clientY: number },
): GridSize {
  const cols = Math.max(
    1,
    Math.round((point.clientX - drag.originLeft) / drag.cellWidthPx),
  );
  const rows = Math.max(
    1,
    Math.round((point.clientY - drag.originTop) / drag.cellHeightPx),
  );
  return GridSize.create(cols, rows);
}

function parseCellKeyToPosition(key: string): Position {
  const comma = key.indexOf(",");
  return Position.create(
    Number(key.slice(0, comma)),
    Number(key.slice(comma + 1)),
  );
}
