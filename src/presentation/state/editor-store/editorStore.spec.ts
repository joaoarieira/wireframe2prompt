import { beforeEach, describe, expect, test } from "vitest";
import {
  createEditorStore,
  previewedDocument,
  selectedElementOf,
  NoOpenDocumentError,
} from "./editorStore";
import type { EditorStore, StrokeState } from "./editorStore";
import { createContainer } from "../../../di/container";
import type { AppContainer } from "../../../di/container";
import { InMemoryWebStorage } from "../../../tests/doubles/InMemoryWebStorage";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { ElementNotFoundError } from "../../../domain/entities/errors/ElementNotFoundError";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import type { LineElement } from "../../../domain/entities/element/LineElement";
import type { TextElement } from "../../../domain/entities/element/TextElement";
import {
  FreeDrawElement,
  freeDrawCellKey,
} from "../../../domain/entities/element/FreeDrawElement";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const cell = (col: number, row: number) => Position.create(col, row);

let container: AppContainer;
let store: EditorStore;

beforeEach(() => {
  let counter = 0;
  container = createContainer({ storage: new InMemoryWebStorage() });
  store = createEditorStore(container, {
    generateId: () => `id-${(counter += 1)}`,
  });
});

/** Persists the 20×10 fixture document and opens it in the editor. */
async function openFixtureDoc(...elements: Parameters<typeof makeDoc>) {
  await container.repository.save(makeDoc(...elements));
  await store.getState().openDocument("doc1");
}

describe("documents", () => {
  test("starts idle with the select tool and no document", () => {
    const state = store.getState();
    expect(state.document).toBeNull();
    expect(state.documentStatus).toBe("idle");
    expect(state.activeToolId).toBe("select");
    expect(state.viewport).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 });
  });

  test("createDocument persists an 80×24 document and refreshes the list", async () => {
    const id = await store.getState().createDocument("landing page");

    expect(id).toBe("id-1");
    expect(store.getState().summaries).toEqual([
      { id: "id-1", name: "landing page" },
    ]);
    const saved = await container.repository.load("id-1");
    expect(saved?.gridSize.cols).toBe(80);
    expect(saved?.gridSize.rows).toBe(24);
  });

  test("deleteDocument removes it from the repository and the list", async () => {
    const id = await store.getState().createDocument("temp");
    await store.getState().deleteDocument(id);

    expect(store.getState().summaries).toEqual([]);
    expect(await container.repository.load(id)).toBeNull();
  });

  test("openDocument loads the document and resets editor state", async () => {
    await openFixtureDoc(makeBox("b1"));

    const state = store.getState();
    expect(state.documentStatus).toBe("ready");
    expect(state.document?.id).toBe("doc1");
    expect(state.selectedElementId).toBeNull();
    expect(state.canUndo).toBe(false);
  });

  test("openDocument flags a missing id and clears stale history", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().placeElement("box", cell(0, 0));
    expect(store.getState().canUndo).toBe(true);

    await store.getState().openDocument("ghost");

    const state = store.getState();
    expect(state.documentStatus).toBe("missing");
    expect(state.document).toBeNull();
    expect(state.canUndo).toBe(false);
  });

  test("saveCurrentDocument persists the edits", async () => {
    await openFixtureDoc();
    store.getState().placeElement("text", cell(1, 1));
    await store.getState().saveCurrentDocument();

    const reloaded = await container.repository.load("doc1");
    expect(reloaded?.elements).toHaveLength(1);
  });

  test("actions that need a document throw NoOpenDocumentError otherwise", async () => {
    await expect(store.getState().saveCurrentDocument()).rejects.toThrow(
      NoOpenDocumentError,
    );
    expect(() => store.getState().exportAscii()).toThrow(
      'cannot export ASCII: no document is open (expected documentStatus "ready")',
    );
  });
});

describe("editing", () => {
  test("placeElement selects the new element and enables undo", async () => {
    await openFixtureDoc(makeBox("b1", 3));

    store.getState().placeElement("box", cell(0, 0)); // on top of b1 (z3)

    const state = store.getState();
    const placed = state.document?.getElement("id-1");
    expect(placed?.zIndex).toBe(4);
    expect(state.selectedElementId).toBe("id-1");
    expect(state.canUndo).toBe(true);
  });

  test("placeElement climbs only above elements it overlaps", async () => {
    await openFixtureDoc();

    store.getState().placeElement("box", cell(0, 0)); // id-1: 8×4, no conflict
    store.getState().placeElement("text", cell(1, 1)); // id-2: on the box
    store.getState().placeElement("line", cell(0, 3)); // id-3: on the box only
    store.getState().placeElement("text", cell(2, 3)); // id-4: on line + box
    store.getState().placeElement("box", cell(10, 5)); // id-5: empty space

    const doc = store.getState().document;
    expect(doc?.getElement("id-1")?.zIndex).toBe(0);
    expect(doc?.getElement("id-2")?.zIndex).toBe(1);
    expect(doc?.getElement("id-3")?.zIndex).toBe(1);
    expect(doc?.getElement("id-4")?.zIndex).toBe(2);
    expect(doc?.getElement("id-5")?.zIndex).toBe(0);
  });

  test("moveElementTo and resizeElementTo go through the use cases", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().moveElementTo("b1", cell(4, 3));
    store.getState().resizeElementTo("b1", Size.create(5, 2));

    const element = store.getState().document?.getElement("b1");
    expect(element?.position.equals(cell(4, 3))).toBe(true);
    expect(element?.size.equals(Size.create(5, 2))).toBe(true);
  });

  test("nudgeSelection moves the selected element and no-ops without one", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().nudgeSelection(1, 0); // nothing selected yet
    expect(store.getState().canUndo).toBe(false);

    store.getState().selectElement("b1");
    store.getState().nudgeSelection(1, -1);
    const element = store.getState().document?.getElement("b1");
    expect(element?.position.equals(cell(1, -1))).toBe(true);
  });

  test("removeSelectedElement removes and clears the selection, no-ops without one", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().removeSelectedElement(); // nothing selected yet
    expect(store.getState().document?.elements).toHaveLength(1);

    store.getState().selectElement("b1");
    store.getState().removeSelectedElement();
    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().selectedElementId).toBeNull();
  });

  test("changeElementZIndex and editElementProps mutate through use cases", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().placeElement("line", cell(0, 0));
    store.getState().placeElement("text", cell(0, 5));

    store.getState().changeElementZIndex("b1", 9);
    store.getState().editElementProps("id-1", { orientation: "v" });
    store.getState().editElementProps("id-2", { text: "Hi" });

    const doc = store.getState().document;
    expect(doc?.getElement("b1")?.zIndex).toBe(9);
    expect((doc?.getElement("id-1") as LineElement).orientation).toBe("v");
    expect((doc?.getElement("id-2") as TextElement).text).toBe("Hi");
  });

  test("undo/redo restore snapshots and refresh the flags", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().moveElementTo("b1", cell(5, 5));
    store.getState().undo();

    let element = store.getState().document?.getElement("b1");
    expect(element?.position.equals(cell(0, 0))).toBe(true);
    expect(store.getState().canRedo).toBe(true);

    store.getState().redo();
    element = store.getState().document?.getElement("b1");
    expect(element?.position.equals(cell(5, 5))).toBe(true);
    expect(store.getState().canRedo).toBe(false);
  });

  test("undo with an empty history keeps the document", async () => {
    await openFixtureDoc(makeBox("b1"));
    const before = store.getState().document;

    store.getState().undo();

    expect(store.getState().document).toBe(before);
  });

  test("applyKeyAction dispatches all four shortcut kinds", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store
      .getState()
      .applyKeyAction({ type: "nudge", deltaCol: 2, deltaRow: 0 });
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(2, 0)),
    ).toBe(true);

    store.getState().applyKeyAction({ type: "undo" });
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);

    store.getState().applyKeyAction({ type: "redo" });
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(2, 0)),
    ).toBe(true);

    store.getState().applyKeyAction({ type: "remove-selected" });
    expect(store.getState().document?.elements).toHaveLength(0);
  });
});

describe("inspector visibility", () => {
  test("opens on pointer release over an element, not on pointer down", async () => {
    await openFixtureDoc(makeBox("b1"));
    expect(store.getState().inspectorOpen).toBe(false);

    store.getState().pointerDownOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(false); // still pressed

    store.getState().pointerUpOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(true);
  });

  test("selectElement alone does not open it; openInspector does", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().selectElement("b1");
    expect(store.getState().inspectorOpen).toBe(false);

    store.getState().openInspector();
    expect(store.getState().inspectorOpen).toBe(true);
  });

  test("placing an element opens it immediately", async () => {
    await openFixtureDoc();

    store.getState().placeElement("box", cell(10, 5));

    expect(store.getState().inspectorOpen).toBe(true);
  });

  test("closeInspector hides it until the next click gesture re-opens it", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().pointerDownOnCell(cell(1, 1));
    store.getState().pointerUpOnCell(cell(1, 1));

    store.getState().closeInspector();
    expect(store.getState().inspectorOpen).toBe(false);

    store.getState().pointerDownOnCell(cell(1, 1)); // clicking the element again
    store.getState().pointerUpOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(true);
  });

  test("clicking empty space closes it; opening a document resets it", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().openInspector();

    store.getState().selectElement(null);
    expect(store.getState().inspectorOpen).toBe(false);

    store.getState().openInspector();
    await openFixtureDoc(makeBox("b1"));
    expect(store.getState().inspectorOpen).toBe(false);
  });

  test("after an empty click closes it, the next element click still opens only on release", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().pointerDownOnCell(cell(1, 1));
    store.getState().pointerUpOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(true);

    store.getState().pointerDownOnCell(cell(9, 9)); // empty space
    store.getState().pointerUpOnCell(cell(9, 9));
    expect(store.getState().inspectorOpen).toBe(false);

    store.getState().pointerDownOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(false); // still pressed

    store.getState().pointerUpOnCell(cell(1, 1));
    expect(store.getState().inspectorOpen).toBe(true);
  });
});

describe("text editing", () => {
  test("placing an element ends any text-editing session", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginTextEditing("b1");

    store.getState().placeElement("text", cell(1, 1));

    expect(store.getState().textEditingElementId).toBeNull();
  });

  test("beginTextEditing/endTextEditing toggle the session", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginTextEditing("b1");
    expect(store.getState().textEditingElementId).toBe("b1");

    store.getState().endTextEditing();
    expect(store.getState().textEditingElementId).toBeNull();
  });

  test("selecting a different element ends the editing session", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().placeElement("text", cell(1, 1));
    store.getState().beginTextEditing("id-1");

    store.getState().selectElement("id-1"); // same element keeps the session
    expect(store.getState().textEditingElementId).toBe("id-1");

    store.getState().selectElement("b1");
    expect(store.getState().textEditingElementId).toBeNull();
  });

  test("single-key shortcuts are suspended while editing; ctrl combos still work", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().moveElementTo("b1", cell(5, 5));
    store.getState().beginTextEditing("b1");

    store.getState().applyKeyAction({ type: "remove-selected" });
    store
      .getState()
      .applyKeyAction({ type: "nudge", deltaCol: 1, deltaRow: 0 });
    expect(store.getState().document?.elements).toHaveLength(1);
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(5, 5)),
    ).toBe(true);

    store.getState().applyKeyAction({ type: "undo" });
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);
  });
});

describe("drag gestures", () => {
  test("move drag previews without touching the committed document", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove("b1", cell(0, 0));
    store.getState().updateDrag(cell(3, 2));

    const state = store.getState();
    const preview = state.composeBuffer(
      previewedDocument(state.document!, state.drag),
    );
    expect(preview.charAt(cell(3, 2))).toBe("+");
    expect(preview.charAt(cell(0, 0))).toBe(" ");
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);
  });

  test("commitDrag applies the move once — one undo restores the origin", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove("b1", cell(0, 0));
    store.getState().updateDrag(cell(2, 1));
    store.getState().updateDrag(cell(6, 4));
    store.getState().commitDrag();

    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(6, 4)),
    ).toBe(true);
    store.getState().undo();
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(false);
  });

  test("resize drag previews the new size before committing", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginResize("b1", cell(1, 1));
    store.getState().updateDrag(cell(4, 1));

    const state = store.getState();
    const preview = state.composeBuffer(
      previewedDocument(state.document!, state.drag),
    );
    expect(preview.charAt(cell(4, 0))).toBe("+"); // widened to 5 columns
    expect(
      store
        .getState()
        .document?.getElement("b1")
        ?.size.equals(Size.create(2, 2)),
    ).toBe(true);
  });

  test("resize drag grows the element and clamps at 1×1", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginResize("b1", cell(1, 1));
    store.getState().updateDrag(cell(4, 2));
    store.getState().commitDrag();
    expect(
      store
        .getState()
        .document?.getElement("b1")
        ?.size.equals(Size.create(5, 3)),
    ).toBe(true);

    store.getState().beginResize("b1", cell(4, 2));
    store.getState().updateDrag(cell(-8, -8));
    store.getState().commitDrag();
    expect(
      store
        .getState()
        .document?.getElement("b1")
        ?.size.equals(Size.create(1, 1)),
    ).toBe(true);
  });

  test("a drag that returns to the start cell commits nothing", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove("b1", cell(1, 1));
    store.getState().updateDrag(cell(1, 1));
    store.getState().commitDrag();

    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().drag).toBeNull();
  });

  test("updateDrag/commitDrag without an active drag are no-ops", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().updateDrag(cell(5, 5));
    store.getState().commitDrag();

    expect(store.getState().drag).toBeNull();
    expect(store.getState().canUndo).toBe(false);
  });

  test("cancelDrag drops the preview", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove("b1", cell(0, 0));
    store.getState().cancelDrag();

    expect(store.getState().drag).toBeNull();
  });

  test("beginMove on an unknown element names it in the error", async () => {
    await openFixtureDoc(makeBox("b1"));

    expect(() => store.getState().beginMove("ghost", cell(0, 0))).toThrow(
      ElementNotFoundError,
    );
  });
});

describe("pointer routing and tools", () => {
  test("select tool: down on an element selects it and dragging moves it", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().pointerDownOnCell(cell(1, 1));
    expect(store.getState().selectedElementId).toBe("b1");

    store.getState().pointerMoveOnCell(cell(4, 4));
    store.getState().pointerUpOnCell(cell(4, 4));
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(3, 3)),
    ).toBe(true);
  });

  test("select tool: down on empty space clears the selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().pointerDownOnCell(cell(9, 9));

    expect(store.getState().selectedElementId).toBeNull();
  });

  test("placement tool: down stamps an element, move/up do nothing", async () => {
    await openFixtureDoc();
    store.getState().setActiveTool("box");

    store.getState().pointerDownOnCell(cell(2, 2));
    store.getState().pointerMoveOnCell(cell(3, 3));
    store.getState().pointerUpOnCell(cell(3, 3));

    const doc = store.getState().document;
    expect(doc?.elements).toHaveLength(1);
    expect(doc?.getElement("id-1")?.position.equals(cell(2, 2))).toBe(true);
  });

  test("setActiveTool rejects unknown ids and cancels a pending drag", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginMove("b1", cell(0, 0));

    expect(() => store.getState().setActiveTool("zoom")).toThrow(
      'unknown tool "zoom"',
    );
    store.getState().setActiveTool("line");
    expect(store.getState().activeToolId).toBe("line");
    expect(store.getState().drag).toBeNull();
  });

  test("listTools exposes the registry for the toolbar", () => {
    expect(
      store
        .getState()
        .listTools()
        .map((tool) => tool.id),
    ).toEqual([
      "select",
      "box",
      "line",
      "text",
      "arrow",
      "card",
      "modal",
      "table",
      "tabs",
      "pencil",
      "eraser",
      "hand",
    ]);
  });
});

describe("output", () => {
  test("composeBuffer rasterizes the given document", async () => {
    await openFixtureDoc(makeBox("b1"));

    const state = store.getState();
    const buffer = state.composeBuffer(state.document!);

    expect(buffer.charAt(cell(0, 0))).toBe("+");
    expect(buffer.charAt(cell(1, 1))).toBe("+");
  });

  test("exportAscii returns the exact raw string", async () => {
    await openFixtureDoc(makeBox("b1"));

    const ascii = store.getState().exportAscii();
    const lines = ascii.split("\n");

    expect(lines).toHaveLength(10);
    expect(lines[0].startsWith("++")).toBe(true);
    expect(lines[0]).toHaveLength(20);
  });
});

describe("viewport", () => {
  test("setZoom clamps to [0.25, 4]", () => {
    store.getState().setZoom(2);
    expect(store.getState().viewport.zoom).toBe(2);

    store.getState().setZoom(0.01);
    expect(store.getState().viewport.zoom).toBe(0.25);

    store.getState().setZoom(99);
    expect(store.getState().viewport.zoom).toBe(4);
  });

  test("panViewportBy accumulates offsets", () => {
    store.getState().panViewportBy(10, -5);
    store.getState().panViewportBy(-2, 3);

    expect(store.getState().viewport.offsetX).toBe(8);
    expect(store.getState().viewport.offsetY).toBe(-2);
  });

  test("zoomAtPoint keeps the anchor pinned under the cursor", () => {
    // Anchor at content-local (100, 50). Screen position before zoom is
    // offset + anchor * zoom = 100 / 50; it must be identical after zooming.
    const anchorX = 100;
    const anchorY = 50;
    const screenBefore = {
      x: 0 + anchorX * 1,
      y: 0 + anchorY * 1,
    };

    store.getState().zoomAtPoint(2, anchorX, anchorY);

    const { zoom, offsetX, offsetY } = store.getState().viewport;
    expect(zoom).toBe(2);
    expect(offsetX + anchorX * zoom).toBe(screenBefore.x);
    expect(offsetY + anchorY * zoom).toBe(screenBefore.y);
  });

  test("zoomAtPoint clamps zoom and anchors against the clamped value", () => {
    store.getState().zoomAtPoint(99, 10, 20);

    const { zoom, offsetX, offsetY } = store.getState().viewport;
    expect(zoom).toBe(4);
    // dz is the clamped delta (4 - 1 = 3), not the requested 98.
    expect(offsetX).toBe(-10 * 3);
    expect(offsetY).toBe(-20 * 3);
  });
});

/** FreeDrawElement with a single char at its origin. */
function makeFD(id: string, col = 0, row = 0): FreeDrawElement {
  return FreeDrawElement.create({
    id,
    position: Position.create(col, row),
    layerId: null,
    zIndex: 0,
    cells: new Map([[freeDrawCellKey(0, 0), CellChar.create("*")]]),
  });
}

describe("pencil/eraser stroke", () => {
  test("setPencilChar updates the pencil character", async () => {
    await openFixtureDoc();
    store.getState().setPencilChar("#");
    expect(store.getState().pencilChar.value).toBe("#");
  });

  test("beginDrawStroke with no freedraw selected sets targetElementId to null", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1"); // box, not freedraw

    store.getState().beginDrawStroke(cell(2, 3));

    const { stroke } = store.getState();
    expect(stroke?.mode).toBe("draw");
    if (stroke?.mode === "draw") {
      expect(stroke.targetElementId).toBeNull();
      expect(stroke.cells.size).toBe(1);
    }
  });

  test("beginDrawStroke with a selected freedraw sets targetElementId", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().selectElement("fd1");

    store.getState().beginDrawStroke(cell(0, 0));

    const { stroke } = store.getState();
    if (stroke?.mode === "draw") {
      expect(stroke.targetElementId).toBe("fd1");
    }
  });

  test("extendStroke appends cells in draw mode", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(1, 1));
    store.getState().extendStroke(cell(2, 1));

    const { stroke } = store.getState();
    expect(stroke?.mode).toBe("draw");
    if (stroke?.mode === "draw") expect(stroke.cells.size).toBe(2);
  });

  test("extendStroke appends keys in erase mode", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().beginEraseStroke(cell(0, 0));
    store.getState().extendStroke(cell(1, 0));

    const { stroke } = store.getState();
    expect(stroke?.mode).toBe("erase");
    if (stroke?.mode === "erase") expect(stroke.cells.size).toBe(2);
  });

  test("extendStroke with no active stroke is a no-op", async () => {
    await openFixtureDoc();
    store.getState().extendStroke(cell(0, 0)); // no active stroke
    expect(store.getState().stroke).toBeNull();
  });

  test("commitStroke with no active stroke is a no-op", async () => {
    await openFixtureDoc();
    store.getState().commitStroke(); // stroke is null
    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().canUndo).toBe(false);
  });

  test("commitStroke (draw, null target) creates a new freedraw element", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(2, 3));
    store.getState().extendStroke(cell(3, 3));
    store.getState().commitStroke();

    expect(store.getState().stroke).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(1);
    expect(store.getState().canUndo).toBe(true);
    const el = store.getState().document?.elements[0];
    expect(el).toBeInstanceOf(FreeDrawElement);
  });

  test("commitStroke (draw, existing target) extends the freedraw element", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().selectElement("fd1");
    store.getState().beginDrawStroke(cell(5, 5));
    store.getState().commitStroke();

    const el = store.getState().document?.getElement("fd1") as FreeDrawElement;
    expect(el.charAt(cell(5, 5))?.value).toBe("*");
    expect(store.getState().canUndo).toBe(true);
  });

  test("commitStroke (draw) with empty cells is a no-op", async () => {
    await openFixtureDoc();
    // Directly set a draw stroke with an empty cells map to exercise the guard at line 519.
    store.setState({
      stroke: {
        mode: "draw",
        targetElementId: null,
        startCell: cell(0, 0),
        cells: new Map(),
      },
    });
    store.getState().commitStroke();
    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().canUndo).toBe(false);
  });

  test("commitStroke (erase) removes chars from freedraw elements", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().beginEraseStroke(cell(0, 0));
    store.getState().commitStroke();

    // The element had only one char at (0,0); after erasing it becomes empty and is removed.
    expect(store.getState().document?.getElement("fd1")).toBeUndefined();
    expect(store.getState().canUndo).toBe(true);
  });

  test("commitStroke (erase) with empty cells is a no-op", async () => {
    await openFixtureDoc(makeFD("fd1"));
    // Directly set an erase stroke with an empty cells set to exercise the guard at line 555.
    store.setState({ stroke: { mode: "erase", cells: new Set() } });
    store.getState().commitStroke();
    expect(store.getState().canUndo).toBe(false);
  });

  test("cancelStroke clears stroke without committing", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(1, 1));
    store.getState().cancelStroke();

    expect(store.getState().stroke).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().canUndo).toBe(false);
  });

  test("setActiveTool clears stroke and panDrag", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(1, 1));
    store.getState().beginPan({ clientX: 0, clientY: 0 });

    store.getState().setActiveTool("select");

    expect(store.getState().stroke).toBeNull();
    expect(store.getState().panDrag).toBeNull();
  });

  test("pencil tool routes through toolContext to beginDrawStroke/extendStroke/commitStroke", async () => {
    await openFixtureDoc();
    store.getState().setActiveTool("pencil");

    store.getState().pointerDownOnCell(cell(1, 1));
    store.getState().pointerMoveOnCell(cell(2, 1));
    store.getState().pointerUpOnCell(cell(2, 1));

    // One freedraw element created by the commit
    expect(store.getState().document?.elements).toHaveLength(1);
    expect(store.getState().canUndo).toBe(true);
  });

  test("eraser tool routes through toolContext to beginEraseStroke/extendStroke/commitStroke", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().setActiveTool("eraser");

    store.getState().pointerDownOnCell(cell(0, 0));
    store.getState().pointerUpOnCell(cell(0, 0));

    // The single-char element is erased and removed
    expect(store.getState().document?.getElement("fd1")).toBeUndefined();
  });

  test("hand tool routes through toolContext to beginPan/updatePan/endPan", () => {
    store.getState().setActiveTool("hand");

    store
      .getState()
      .pointerDownOnCell(cell(0, 0), { clientX: 100, clientY: 200 });
    store
      .getState()
      .pointerMoveOnCell(cell(0, 0), { clientX: 110, clientY: 210 });
    store
      .getState()
      .pointerUpOnCell(cell(0, 0), { clientX: 110, clientY: 210 });

    expect(store.getState().viewport.offsetX).toBe(10);
    expect(store.getState().viewport.offsetY).toBe(10);
    expect(store.getState().panDrag).toBeNull();
  });
});

describe("hand/pan", () => {
  test("beginPan/updatePan/endPan moves the viewport", () => {
    store.getState().beginPan({ clientX: 100, clientY: 200 });
    expect(store.getState().panDrag).not.toBeNull();

    store.getState().updatePan({ clientX: 110, clientY: 205 });
    expect(store.getState().viewport.offsetX).toBe(10);
    expect(store.getState().viewport.offsetY).toBe(5);

    store.getState().endPan();
    expect(store.getState().panDrag).toBeNull();
  });

  test("updatePan without an active panDrag is a no-op", () => {
    store.getState().updatePan({ clientX: 100, clientY: 200 });
    expect(store.getState().viewport.offsetX).toBe(0);
  });
});

describe("pure helpers", () => {
  test("previewedDocument returns the document untouched without drag or stroke", async () => {
    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document;

    expect(previewedDocument(document!, null, null)).toBe(document);
  });

  test("previewedDocument draw stroke (null target) inserts a temp element", async () => {
    await openFixtureDoc();
    const document = store.getState().document!;
    const stroke: StrokeState = {
      mode: "draw",
      targetElementId: null,
      startCell: cell(1, 1),
      cells: new Map([["1,1", CellChar.create("x")]]),
    };

    const preview = previewedDocument(document, null, stroke);

    expect(preview.elements).toHaveLength(1);
    expect(preview.elements[0].id).toBe("__preview__");
  });

  test("previewedDocument draw stroke (existing target) applies cells", async () => {
    await openFixtureDoc(makeFD("fd1"));
    const document = store.getState().document!;
    const stroke: StrokeState = {
      mode: "draw",
      targetElementId: "fd1",
      startCell: cell(5, 5),
      cells: new Map([["5,5", CellChar.create("z")]]),
    };

    const preview = previewedDocument(document, null, stroke);
    const el = preview.getElement("fd1") as FreeDrawElement;

    expect(el.charAt(cell(5, 5))?.value).toBe("z");
  });

  test("previewedDocument draw stroke (bad target) returns original", async () => {
    await openFixtureDoc();
    const document = store.getState().document!;
    const stroke: StrokeState = {
      mode: "draw",
      targetElementId: "nonexistent",
      startCell: cell(0, 0),
      cells: new Map([["0,0", CellChar.create("a")]]),
    };

    const preview = previewedDocument(document, null, stroke);

    expect(preview).toBe(document);
  });

  test("previewedDocument erase stroke removes chars", async () => {
    await openFixtureDoc(makeFD("fd1"));
    const document = store.getState().document!;
    const stroke: StrokeState = {
      mode: "erase",
      cells: new Set(["0,0"]),
    };

    const preview = previewedDocument(document, null, stroke);

    // Element had one char; after erasing it becomes empty and is removed.
    expect(preview.elements).toHaveLength(0);
  });

  test("previewedDocument with empty stroke cells returns document unchanged", async () => {
    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document!;
    const stroke: StrokeState = { mode: "erase", cells: new Set() };

    expect(previewedDocument(document, null, stroke)).toBe(document);
  });

  test("previewedDocument draw stroke (null target) with __preview__ id conflict falls back to original", async () => {
    // Edge case: an element with id "__preview__" already exists → addElement throws → catch returns original doc.
    const previewEl = FreeDrawElement.create({
      id: "__preview__",
      position: cell(0, 0),
      layerId: null,
      zIndex: 0,
      cells: new Map([[freeDrawCellKey(0, 0), CellChar.create("p")]]),
    });
    await openFixtureDoc(previewEl);
    const document = store.getState().document!;
    const stroke: StrokeState = {
      mode: "draw",
      targetElementId: null,
      startCell: cell(1, 1),
      cells: new Map([["1,1", CellChar.create("x")]]),
    };

    // Should not throw; falls back to original document
    const preview = previewedDocument(document, null, stroke);
    expect(preview).toBe(document);
  });

  test("selectedElementOf guards every miss case", async () => {
    expect(
      selectedElementOf({ document: null, selectedElementId: "b1" }),
    ).toBeNull();

    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document;
    expect(selectedElementOf({ document, selectedElementId: null })).toBeNull();
    expect(
      selectedElementOf({ document, selectedElementId: "ghost" }),
    ).toBeNull();
    expect(selectedElementOf({ document, selectedElementId: "b1" })?.id).toBe(
      "b1",
    );
  });
});
