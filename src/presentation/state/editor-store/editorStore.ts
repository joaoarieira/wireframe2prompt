import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";
import type { AppContainer } from "../../../di/container";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../../domain/entities/element/Element";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import type { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import type { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import type { DocumentSummary } from "../../../domain/ports/IDocumentRepository";
import { ElementNotFoundError } from "../../../domain/entities/errors/ElementNotFoundError";
import { buildElement } from "../element-factory/elementFactory";
import type { PlaceableKind } from "../element-factory/elementFactory";
import { elementAtCell, zIndexForPlacement } from "../hit-test/hitTest";
import type { CanvasTool, ToolContext } from "../tools/CanvasTool";
import { ToolRegistry, createDefaultToolRegistry } from "../tools/ToolRegistry";
import type { EditorKeyAction } from "../keyboard/editorKeyAction";

const DEFAULT_GRID_COLS = 80;
const DEFAULT_GRID_ROWS = 24;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

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

export type DragMode = "move" | "resize";

export interface DragState {
  mode: DragMode;
  elementId: string;
  startCell: Position;
  lastCell: Position;
  originPosition: Position;
  originSize: Size;
}

export type DocumentStatus = "idle" | "loading" | "ready" | "missing";

export interface EditorState {
  document: WireframeDocument | null;
  documentStatus: DocumentStatus;
  summaries: DocumentSummary[];
  selectedElementId: string | null;
  activeToolId: string;
  drag: DragState | null;
  viewport: Viewport;
  canUndo: boolean;
  canRedo: boolean;
  /**
   * Element whose text is being typed right now. While set, single-key
   * shortcuts (Delete, arrows, future V/H tool keys) are suspended so the
   * keystrokes belong to the text field.
   */
  textEditingElementId: string | null;
  /**
   * Whether the inspector panel is shown. Selecting or placing an element
   * opens it; the panel's ✕ closes it. The page only renders the panel when
   * this is true AND something is selected.
   */
  inspectorOpen: boolean;
}

export interface EditorActions {
  refreshDocuments(): Promise<void>;
  createDocument(name: string): Promise<string>;
  deleteDocument(documentId: string): Promise<void>;
  openDocument(documentId: string): Promise<void>;
  saveCurrentDocument(): Promise<void>;
  selectElement(elementId: string | null): void;
  openInspector(): void;
  closeInspector(): void;
  beginTextEditing(elementId: string): void;
  endTextEditing(): void;
  setActiveTool(toolId: string): void;
  listTools(): readonly CanvasTool[];
  placeElement(kind: PlaceableKind, cell: Position): void;
  moveElementTo(elementId: string, position: Position): void;
  resizeElementTo(elementId: string, size: Size): void;
  nudgeSelection(deltaCol: number, deltaRow: number): void;
  removeSelectedElement(): void;
  changeElementZIndex(elementId: string, zIndex: number): void;
  editElementProps(
    elementId: string,
    props: Readonly<Record<string, unknown>>,
  ): void;
  undo(): void;
  redo(): void;
  applyKeyAction(action: EditorKeyAction): void;
  beginMove(elementId: string, cell: Position): void;
  beginResize(elementId: string, cell: Position): void;
  updateDrag(cell: Position): void;
  commitDrag(): void;
  cancelDrag(): void;
  pointerDownOnCell(cell: Position): void;
  pointerMoveOnCell(cell: Position): void;
  pointerUpOnCell(cell: Position): void;
  composeBuffer(document: WireframeDocument): CharBuffer;
  exportAscii(): string;
  setZoom(zoom: number): void;
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

const initialState: EditorState = {
  document: null,
  documentStatus: "idle",
  summaries: [],
  selectedElementId: null,
  activeToolId: "select",
  drag: null,
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  canUndo: false,
  canRedo: false,
  textEditingElementId: null,
  inspectorOpen: false,
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

    /** Applies a mutated document and refreshes the undo/redo button state. */
    const commitDocument = (document: WireframeDocument): void => {
      set({
        document,
        canUndo: container.history.canUndo,
        canRedo: container.history.canRedo,
      });
    };

    const toolContext = (): ToolContext => ({
      elementAt: (cell) =>
        elementAtCell(requireDocument("hit-test a cell"), cell),
      select: (elementId) => get().selectElement(elementId),
      placeElement: (kind, cell) => get().placeElement(kind, cell),
      beginMove: (elementId, cell) => get().beginMove(elementId, cell),
      updateDrag: (cell) => get().updateDrag(cell),
      commitDrag: () => get().commitDrag(),
    });

    const beginDrag = (
      mode: DragMode,
      elementId: string,
      cell: Position,
    ): void => {
      const element = requireElement(
        requireDocument(`start a ${mode} drag`),
        elementId,
      );
      set({
        drag: {
          mode,
          elementId,
          startCell: cell,
          lastCell: cell,
          originPosition: element.position,
          originSize: element.size,
        },
      });
    };

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
        set({
          documentStatus: "loading",
          document: null,
          selectedElementId: null,
          drag: null,
          textEditingElementId: null,
          inspectorOpen: false,
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
        set({
          selectedElementId: elementId,
          // selecting something else ends any text-editing session
          textEditingElementId:
            get().textEditingElementId === elementId ? elementId : null,
          // clicking empty space truly closes the panel (flag included) —
          // otherwise the next pointer down would re-show it before release
          inspectorOpen: elementId === null ? false : get().inspectorOpen,
        });
      },

      openInspector: () => {
        set({ inspectorOpen: true });
      },

      closeInspector: () => {
        set({ inspectorOpen: false });
      },

      beginTextEditing: (elementId) => {
        set({ textEditingElementId: elementId });
      },

      endTextEditing: () => {
        set({ textEditingElementId: null });
      },

      setActiveTool: (toolId) => {
        toolRegistry.get(toolId); // fail fast on unknown ids
        set({ activeToolId: toolId, drag: null });
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
          selectedElementId: element.id,
          textEditingElementId: null,
          inspectorOpen: true,
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
        const { selectedElementId } = get();
        if (selectedElementId === null) {
          return;
        }
        const document = requireDocument("nudge the selection");
        const element = requireElement(document, selectedElementId);
        get().moveElementTo(
          selectedElementId,
          element.position.translate(deltaCol, deltaRow),
        );
      },

      removeSelectedElement: () => {
        const { selectedElementId } = get();
        if (selectedElementId === null) {
          return;
        }
        const document = requireDocument("remove the selection");
        commitDocument(
          container.removeElement.execute({
            document,
            elementId: selectedElementId,
          }),
        );
        set({ selectedElementId: null });
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
        if (get().textEditingElementId !== null && isSingleKeyAction(action)) {
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
        if (action.type === "remove-selected") {
          get().removeSelectedElement();
          return;
        }
        get().nudgeSelection(action.deltaCol, action.deltaRow);
      },

      beginMove: (elementId, cell) => beginDrag("move", elementId, cell),

      beginResize: (elementId, cell) => beginDrag("resize", elementId, cell),

      updateDrag: (cell) => {
        const { drag } = get();
        if (drag === null) {
          return;
        }
        set({ drag: { ...drag, lastCell: cell } });
      },

      commitDrag: () => {
        const { drag } = get();
        if (drag === null) {
          return;
        }
        // The pointer was released over the dragged (= selected) element:
        // this is the moment the inspector opens, not on pointer down.
        set({ drag: null, inspectorOpen: true });
        if (drag.lastCell.equals(drag.startCell)) {
          return;
        }
        const document = requireDocument("commit a drag");
        commitDocument(executeDrag(container, document, drag));
      },

      cancelDrag: () => {
        set({ drag: null });
      },

      pointerDownOnCell: (cell) => {
        activeTool(toolRegistry, get()).onCellPointerDown(toolContext(), cell);
      },

      pointerMoveOnCell: (cell) => {
        activeTool(toolRegistry, get()).onCellPointerMove(toolContext(), cell);
      },

      pointerUpOnCell: (cell) => {
        activeTool(toolRegistry, get()).onCellPointerUp(toolContext(), cell);
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
        const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        set({ viewport: { ...get().viewport, zoom: clamped } });
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
 */
export function previewedDocument(
  document: WireframeDocument,
  drag: DragState | null,
): WireframeDocument {
  if (drag === null) {
    return document;
  }
  if (drag.mode === "move") {
    return document.moveElement(drag.elementId, dragTargetPosition(drag));
  }
  return document.resizeElement(drag.elementId, dragTargetSize(drag));
}

/** Selected element instance, or null when nothing valid is selected. */
export function selectedElementOf(
  state: Pick<EditorState, "document" | "selectedElementId">,
): Element | null {
  if (state.document === null || state.selectedElementId === null) {
    return null;
  }
  return state.document.getElement(state.selectedElementId) ?? null;
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

/** Modifier-less shortcuts — the ones a text field must be able to swallow. */
function isSingleKeyAction(action: EditorKeyAction): boolean {
  return action.type === "remove-selected" || action.type === "nudge";
}

function dragTargetPosition(drag: DragState): Position {
  return drag.originPosition.translate(
    drag.lastCell.col - drag.startCell.col,
    drag.lastCell.row - drag.startCell.row,
  );
}

/** Resize never lets the mouse shrink an element below 1×1. */
function dragTargetSize(drag: DragState): Size {
  return Size.create(
    Math.max(1, drag.originSize.width + drag.lastCell.col - drag.startCell.col),
    Math.max(
      1,
      drag.originSize.height + drag.lastCell.row - drag.startCell.row,
    ),
  );
}

function executeDrag(
  container: AppContainer,
  document: WireframeDocument,
  drag: DragState,
): WireframeDocument {
  if (drag.mode === "move") {
    return container.moveElement.execute({
      document,
      elementId: drag.elementId,
      position: dragTargetPosition(drag),
    });
  }
  return container.resizeElement.execute({
    document,
    elementId: drag.elementId,
    size: dragTargetSize(drag),
  });
}
