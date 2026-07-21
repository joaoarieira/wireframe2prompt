import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  AUTOSAVE_IDLE_MS,
  AUTOSAVE_SAVING_DISPLAY_MS,
  createEditorStore,
  previewedDocument,
  selectedElementOf,
  selectedElementsOf,
  marqueeRect,
  NoOpenDocumentError,
} from "./editorStore";
import type {
  DragState,
  EditorStore,
  StrokeState,
  MarqueeState,
} from "./editorStore";
import { createContainer } from "../../../di/container";
import type { AppContainer } from "../../../di/container";
import { InMemoryWebStorage } from "../../../tests/doubles/InMemoryWebStorage";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { ElementNotFoundError } from "../../../domain/entities/errors/ElementNotFoundError";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";
import type { LineElement } from "../../../domain/entities/element/LineElement";
import type { ArrowElement } from "../../../domain/entities/element/ArrowElement";
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
    expect(state.selectedElementIds).toEqual([]);
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

describe("autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("a fresh document keeps the indicator hidden until the idle time passes", async () => {
    await openFixtureDoc();
    expect(store.getState().saveStatus).toBe("hidden");

    store.getState().placeElement("box", cell(0, 0));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS - 1);

    expect(store.getState().saveStatus).toBe("hidden");
  });

  test("5s after the last edit it saves, showing saving for 2s and then saved", async () => {
    await openFixtureDoc();
    store.getState().placeElement("box", cell(0, 0));

    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS);
    expect(store.getState().saveStatus).toBe("saving");

    await vi.advanceTimersByTimeAsync(AUTOSAVE_SAVING_DISPLAY_MS - 1);
    expect(store.getState().saveStatus).toBe("saving");

    await vi.advanceTimersByTimeAsync(1);
    expect(store.getState().saveStatus).toBe("saved");
    const reloaded = await container.repository.load("doc1");
    expect(reloaded?.elements).toHaveLength(1);
  });

  test("an edit during the countdown restarts the 5s idle timer", async () => {
    await openFixtureDoc();
    store.getState().placeElement("box", cell(0, 0));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS - 1);

    store.getState().placeElement("box", cell(5, 5));
    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS - 1);
    expect(store.getState().saveStatus).toBe("hidden");

    await vi.advanceTimersByTimeAsync(1);
    expect(store.getState().saveStatus).toBe("saving");
  });

  test("opening a document cancels the pending autosave and hides the indicator", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().placeElement("box", cell(0, 0));

    await store.getState().openDocument("doc1");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS * 2);

    expect(store.getState().saveStatus).toBe("hidden");
    const reloaded = await container.repository.load("doc1");
    expect(reloaded?.elements).toHaveLength(1);
  });

  test("a failed save hides the indicator instead of showing saved", async () => {
    await openFixtureDoc();
    store.getState().placeElement("box", cell(0, 0));
    vi.spyOn(container.saveDocument, "execute").mockRejectedValue(
      new Error("storage unavailable"),
    );

    // The rejection short-circuits Promise.all, so "saving" flips straight
    // back to "hidden" without waiting out the 2s display window.
    await vi.advanceTimersByTimeAsync(AUTOSAVE_IDLE_MS);
    expect(store.getState().saveStatus).toBe("hidden");

    await vi.advanceTimersByTimeAsync(AUTOSAVE_SAVING_DISPLAY_MS);
    expect(store.getState().saveStatus).toBe("hidden");
  });
});

describe("editing", () => {
  test("placeElement selects the new element and enables undo", async () => {
    await openFixtureDoc(makeBox("b1", 3));

    store.getState().placeElement("box", cell(0, 0)); // on top of b1 (z3)

    const state = store.getState();
    const placed = state.document?.getElement("id-1");
    expect(placed?.zIndex).toBe(4);
    expect(state.selectedElementIds).toEqual(["id-1"]);
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

  test("removeSelectedElements removes and clears the selection, no-ops without one", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().removeSelectedElements(); // nothing selected yet
    expect(store.getState().document?.elements).toHaveLength(1);

    store.getState().selectElement("b1");
    store.getState().removeSelectedElements();
    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().selectedElementIds).toEqual([]);
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

describe("multi-select store actions", () => {
  test("toggleElementSelection adds if absent, removes if present", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));

    store.getState().toggleElementSelection("b1");
    expect(store.getState().selectedElementIds).toEqual(["b1"]);

    store.getState().toggleElementSelection("b2");
    expect(store.getState().selectedElementIds).toEqual(["b1", "b2"]);

    store.getState().toggleElementSelection("b1");
    expect(store.getState().selectedElementIds).toEqual(["b2"]);
  });

  test("toggleElementSelection closes inspector when result is not exactly 1", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().selectElement("b1");
    store.getState().openInspector();

    store.getState().toggleElementSelection("b2");
    expect(store.getState().selectedElementIds).toHaveLength(2);
    expect(store.getState().inspectorOpen).toBe(false);
  });

  test("replaceSelection deduplicates ids", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));

    store.getState().replaceSelection(["b1", "b2", "b1"]);

    expect(store.getState().selectedElementIds).toEqual(["b1", "b2"]);
  });

  test("selectElement with null clears all ids", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);

    store.getState().selectElement(null);

    expect(store.getState().selectedElementIds).toEqual([]);
  });

  test("selectedElementOf returns null with 2 elements selected", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));

    store.getState().replaceSelection(["b1", "b2"]);

    expect(
      selectedElementOf({
        document: store.getState().document,
        selectedElementIds: store.getState().selectedElementIds,
      }),
    ).toBeNull();
  });

  test("move drag of 2 elements applies same delta and generates 1 undo", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);

    store.getState().beginMove(["b1", "b2"], cell(0, 0));
    store.getState().updateDrag(cell(3, 2));
    store.getState().commitDrag();

    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(3, 2)),
    ).toBe(true);
    expect(
      store.getState().document?.getElement("b2")?.position.equals(cell(3, 2)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);
    expect(
      store.getState().document?.getElement("b2")?.position.equals(cell(0, 0)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(false);
  });

  test("commitDrag multi-move does not open inspector", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);

    store.getState().beginMove(["b1", "b2"], cell(0, 0));
    store.getState().updateDrag(cell(3, 2));
    store.getState().commitDrag();

    expect(store.getState().inspectorOpen).toBe(false);
  });

  test("delete of 2 selected removes both with 1 undo", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);

    store.getState().removeSelectedElements();

    expect(store.getState().document?.elements).toHaveLength(0);
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(store.getState().document?.elements).toHaveLength(2);
    expect(store.getState().canUndo).toBe(false);
  });

  test("nudge of 2 selected elements with 1 undo", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);

    store.getState().nudgeSelection(2, 1);

    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(2, 1)),
    ).toBe(true);
    expect(
      store.getState().document?.getElement("b2")?.position.equals(cell(2, 1)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(store.getState().canUndo).toBe(false);
  });

  test("previewedDocument moves 2 elements mid-drag", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().beginMove(["b1", "b2"], cell(0, 0));
    store.getState().updateDrag(cell(3, 2));

    const state = store.getState();
    const preview = previewedDocument(state.document!, state.drag);
    expect(preview.getElement("b1")?.position.equals(cell(3, 2))).toBe(true);
    expect(preview.getElement("b2")?.position.equals(cell(3, 2))).toBe(true);
    expect(state.document?.getElement("b1")?.position.equals(cell(0, 0))).toBe(
      true,
    );
  });

  test("right-button on already-selected element opens context menu without re-selecting", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().pointerDownOnCell(cell(0, 0), {
      clientX: 5,
      clientY: 5,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().selectedElementIds).toEqual(["b1"]);
    expect(store.getState().contextMenu).not.toBeNull();
  });

  test("right-button on element selects it and opens context menu (select tool)", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().pointerDownOnCell(cell(0, 0), {
      clientX: 5,
      clientY: 5,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().selectedElementIds).toEqual(["b1"]);
    expect(store.getState().contextMenu?.target).toBe("element");
    expect(store.getState().marquee).toBeNull();
  });

  test("right-button on element opens context menu regardless of active tool", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().setActiveTool("box");

    store.getState().pointerDownOnCell(cell(1, 1), {
      clientX: 8,
      clientY: 8,
      button: 2,
      shiftKey: false,
    });

    // Store-level hit-test fires before tool delegation → menu opens, no extra element placed
    expect(store.getState().contextMenu).not.toBeNull();
    expect(store.getState().selectedElementIds).toEqual(["b1"]);
    expect(store.getState().document?.elements).toHaveLength(1);
  });

  test("right-button on empty space opens the paste-only menu, no marquee", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().pointerDownOnCell(cell(10, 8), {
      clientX: 30,
      clientY: 40,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().marquee).toBeNull();
    expect(store.getState().contextMenu).toEqual({
      clientX: 30,
      clientY: 40,
      cell: cell(10, 8),
      target: "empty",
    });
    // Selection is untouched — the empty-target menu only offers paste.
    expect(store.getState().selectedElementIds).toEqual(["b1"]);
  });

  test("right-button on empty space opens the paste-only menu regardless of active tool", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().setActiveTool("box");

    store.getState().pointerDownOnCell(cell(10, 8), {
      clientX: 0,
      clientY: 0,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().contextMenu?.target).toBe("empty");
    expect(store.getState().document?.elements).toHaveLength(1); // nothing placed
  });

  test("right-button with no open document opens the paste-only menu", () => {
    store.getState().pointerDownOnCell(cell(0, 0), {
      clientX: 0,
      clientY: 0,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().contextMenu?.target).toBe("empty");
  });

  test("commitMarquee additive unions with current selection", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().selectElement("b1");

    store.getState().beginMarquee(cell(0, 0));
    store.getState().updateMarquee(cell(1, 1));
    store.getState().commitMarquee(true); // additive

    expect(store.getState().selectedElementIds).toContain("b1");
    expect(store.getState().selectedElementIds).toContain("b2");
  });

  test("commitMarquee non-additive with hits replaces selection with exactly the hit elements", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().selectElement("b2");

    // Multi-cell marquee (size > 1) so it does not short-circuit to selectElement(null)
    store.getState().beginMarquee(cell(0, 0));
    store.getState().updateMarquee(cell(3, 3));
    store.getState().commitMarquee(false);

    // Both boxes are at (0,0) with size 2×2, so both are hit
    expect(store.getState().selectedElementIds).toContain("b1");
    expect(store.getState().selectedElementIds).toContain("b2");
  });

  test("commitMarquee empty rect without additive clears selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().beginMarquee(cell(15, 8));
    store.getState().commitMarquee(false);

    expect(store.getState().selectedElementIds).toEqual([]);
  });

  test("cancelMarquee drops the marquee without affecting selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().beginMarquee(cell(5, 5));
    store.getState().cancelMarquee();

    expect(store.getState().marquee).toBeNull();
    expect(store.getState().selectedElementIds).toEqual(["b1"]);
  });

  test("updateMarquee is a no-op when no marquee is active", async () => {
    await openFixtureDoc();
    store.getState().updateMarquee(cell(5, 5));
    expect(store.getState().marquee).toBeNull();
  });

  test("commitMarquee is a no-op when no marquee is active", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().commitMarquee(false);
    expect(store.getState().selectedElementIds).toEqual(["b1"]);
  });

  test("commitMarquee is a no-op when document was cleared before commit", () => {
    // Force the unusual state: marquee started with a doc, then doc wiped.
    store.setState({
      marquee: {
        startCell: cell(0, 0),
        lastCell: cell(1, 1),
      },
      document: null,
    });
    store.getState().commitMarquee(false);
    expect(store.getState().marquee).toBeNull();
    expect(store.getState().selectedElementIds).toEqual([]);
  });

  test("shift+click via pointerDownOnCell toggles the element's selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    // Select b1 first so that the toggle de-selects it.
    store.getState().selectElement("b1");

    store.getState().pointerDownOnCell(cell(1, 1), {
      clientX: 0,
      clientY: 0,
      button: 0,
      shiftKey: true,
    });

    expect(store.getState().selectedElementIds).toEqual([]);
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

  test("layers panel starts closed and opens/closes/toggles", () => {
    expect(store.getState().layersPanelOpen).toBe(false);

    store.getState().openLayersPanel();
    expect(store.getState().layersPanelOpen).toBe(true);

    store.getState().closeLayersPanel();
    expect(store.getState().layersPanelOpen).toBe(false);

    store.getState().toggleLayersPanel();
    expect(store.getState().layersPanelOpen).toBe(true);
    store.getState().toggleLayersPanel();
    expect(store.getState().layersPanelOpen).toBe(false);
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
  test("placing a non-text element ends any text-editing session", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginTextEditing("b1");

    store.getState().placeElement("box", cell(1, 1));

    expect(store.getState().textEditingElementId).toBeNull();
  });

  test("placing a text element opens canvas inline editing for that element", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().placeElement("text", cell(1, 1));

    expect(store.getState().canvasEditingElementId).toBe(
      store.getState().selectedElementIds[0],
    );
    expect(store.getState().textEditingElementId).toBe(
      store.getState().selectedElementIds[0],
    );
  });

  test("beginTextEditing/endTextEditing toggle the session without canvas overlay", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginTextEditing("b1");
    expect(store.getState().textEditingElementId).toBe("b1");
    expect(store.getState().canvasEditingElementId).toBeNull();

    store.getState().endTextEditing();
    expect(store.getState().textEditingElementId).toBeNull();
  });

  test("beginCanvasInlineEditing sets both textEditingElementId and canvasEditingElementId", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginCanvasInlineEditing("b1");
    expect(store.getState().textEditingElementId).toBe("b1");
    expect(store.getState().canvasEditingElementId).toBe("b1");

    store.getState().endTextEditing();
    expect(store.getState().textEditingElementId).toBeNull();
    expect(store.getState().canvasEditingElementId).toBeNull();
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

  test("beginCanvasFieldEditing tracks the element and the targeted slot", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginCanvasFieldEditing("b1", "hint");
    expect(store.getState().textEditingElementId).toBe("b1");
    expect(store.getState().canvasEditingElementId).toBe("b1");
    expect(store.getState().canvasEditingField).toBe("hint");

    store.getState().endTextEditing();
    expect(store.getState().canvasEditingField).toBeNull();
  });

  test("re-selecting the field-edited element keeps its slot; another clears it", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));

    store.getState().beginCanvasFieldEditing("b1", "label");
    store.getState().selectElement("b1");
    expect(store.getState().canvasEditingField).toBe("label");

    store.getState().selectElement("b2");
    expect(store.getState().canvasEditingField).toBeNull();
  });

  test("beginCanvasInlineEditing clears any prior field slot", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginCanvasFieldEditing("b1", "placeholder");
    store.getState().beginCanvasInlineEditing("b1");
    expect(store.getState().canvasEditingField).toBeNull();
  });

  test("doubleClickOnCell on a field element begins editing its targeted slot", async () => {
    await openFixtureDoc();
    store.getState().placeElement("input", cell(1, 1));
    const inputId = store.getState().selectedElementIds[0];
    store.getState().endTextEditing();

    // The label sits on the input's top border row (the placement anchor).
    store.getState().doubleClickOnCell(cell(3, 1));

    expect(store.getState().canvasEditingElementId).toBe(inputId);
    expect(store.getState().canvasEditingField).toBe("label");
  });

  test("doubleClickOnCell on a text element begins canvas inline editing", async () => {
    await openFixtureDoc();
    store.getState().placeElement("text", cell(1, 1));
    const textId = store.getState().selectedElementIds[0];
    store.getState().endTextEditing();

    store.getState().doubleClickOnCell(cell(1, 1));

    expect(store.getState().textEditingElementId).toBe(textId);
    expect(store.getState().canvasEditingElementId).toBe(textId);
  });

  test("doubleClickOnCell on a tool without handler does not throw", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().setActiveTool("box");

    expect(() => store.getState().doubleClickOnCell(cell(0, 0))).not.toThrow();
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

    store.getState().beginMove(["b1"], cell(0, 0));
    store.getState().updateDrag(cell(3, 2));

    const state = store.getState();
    const preview = state.composeBuffer(
      previewedDocument(state.document!, state.drag),
    );
    expect(preview.charAt(cell(3, 2))).toBe("┌");
    expect(preview.charAt(cell(0, 0))).toBe(" ");
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(0, 0)),
    ).toBe(true);
  });

  test("commitDrag applies the move once — one undo restores the origin", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove(["b1"], cell(0, 0));
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
    expect(preview.charAt(cell(4, 0))).toBe("┐"); // widened to 5 columns
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

  test("resizing a horizontal line downwards flips it to vertical in one undo", async () => {
    await openFixtureDoc();
    store.getState().placeElement("line", cell(0, 0)); // id-1: 6×1 h

    store.getState().beginResize("id-1", cell(5, 0));
    store.getState().updateDrag(cell(5, 3)); // 3 cells down

    const dragState = store.getState();
    const ghost = previewedDocument(
      dragState.document!,
      dragState.drag,
    ).getElement("id-1") as LineElement;
    expect(ghost.orientation).toBe("v");
    expect(ghost.size.equals(Size.create(1, 4))).toBe(true);

    store.getState().commitDrag();
    const committed = store
      .getState()
      .document!.getElement("id-1") as LineElement;
    expect(committed.orientation).toBe("v");
    expect(committed.size.equals(Size.create(1, 4))).toBe(true);

    store.getState().undo(); // one snapshot restores size AND orientation
    const restored = store
      .getState()
      .document!.getElement("id-1") as LineElement;
    expect(restored.orientation).toBe("h");
    expect(restored.size.equals(Size.create(6, 1))).toBe(true);
  });

  test("widening a horizontal line one cell down keeps it horizontal", async () => {
    await openFixtureDoc();
    store.getState().placeElement("line", cell(0, 0)); // id-1: 6×1 h

    store.getState().beginResize("id-1", cell(5, 0));
    store.getState().updateDrag(cell(8, 1)); // +3 cols, +1 row
    store.getState().commitDrag();

    const line = store.getState().document!.getElement("id-1") as LineElement;
    expect(line.orientation).toBe("h");
    // Height collapses to the line's canonical 1; width grows.
    expect(line.size.equals(Size.create(9, 1))).toBe(true);
  });

  test("a plain click places a default-sized element and one undo removes it", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("box", cell(2, 1));
    store.getState().commitDrag();

    const state = store.getState();
    const placed = state.document!.getElement("id-1")!;
    expect(placed.position.equals(cell(2, 1))).toBe(true);
    expect(placed.size.equals(Size.create(8, 4))).toBe(true);
    expect(state.selectedElementIds).toEqual(["id-1"]);
    expect(state.inspectorOpen).toBe(true);
    expect(state.drag).toBeNull();

    store.getState().undo();
    expect(store.getState().document!.getElement("id-1")).toBeUndefined();
    expect(store.getState().canUndo).toBe(false);
  });

  test("a placement drag across 5×5 cells sizes the box inclusively", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("box", cell(0, 0));
    store.getState().updateDrag(cell(4, 4));
    store.getState().commitDrag();

    const placed = store.getState().document!.getElement("id-1")!;
    expect(placed.size.equals(Size.create(5, 5))).toBe(true);
  });

  test("a line placement drag one cell down stays horizontal", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("line", cell(0, 0));
    store.getState().updateDrag(cell(3, 1));
    store.getState().commitDrag();

    const line = store.getState().document!.getElement("id-1") as LineElement;
    expect(line.orientation).toBe("h");
    expect(line.size.equals(Size.create(4, 1))).toBe(true);
  });

  test("a line placement drag four cells down flips to vertical 1×5", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("line", cell(0, 0));
    store.getState().updateDrag(cell(0, 4));
    store.getState().commitDrag();

    const line = store.getState().document!.getElement("id-1") as LineElement;
    expect(line.orientation).toBe("v");
    expect(line.size.equals(Size.create(1, 5))).toBe(true);
  });

  test("a placement drag up-left of the anchor grows the box toward the mouse", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("box", cell(5, 5));
    store.getState().updateDrag(cell(2, 1));
    store.getState().commitDrag();

    const placed = store.getState().document!.getElement("id-1")!;
    expect(placed.position.equals(cell(2, 1))).toBe(true);
    expect(placed.size.equals(Size.create(4, 5))).toBe(true);
  });

  test("a line placement drag to the left spans left on the anchor row", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("line", cell(5, 3));
    store.getState().updateDrag(cell(1, 3));
    store.getState().commitDrag();

    const line = store.getState().document!.getElement("id-1") as LineElement;
    expect(line.orientation).toBe("h");
    expect(line.position.equals(cell(1, 3))).toBe(true);
    expect(line.size.equals(Size.create(5, 1))).toBe(true);
  });

  test("a line placement drag upwards flips to vertical and grows up", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("line", cell(2, 5));
    store.getState().updateDrag(cell(2, 1));
    store.getState().commitDrag();

    const line = store.getState().document!.getElement("id-1") as LineElement;
    expect(line.orientation).toBe("v");
    expect(line.position.equals(cell(2, 1))).toBe(true);
    expect(line.size.equals(Size.create(1, 5))).toBe(true);
  });

  test("an arrow placement drag to the right points the head right", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("arrow", cell(0, 0));
    store.getState().updateDrag(cell(4, 0));
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("right");
    expect(arrow.position.equals(cell(0, 0))).toBe(true);
    expect(arrow.size.equals(Size.create(5, 1))).toBe(true);
  });

  test("an arrow placement drag to the left points the head left", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("arrow", cell(6, 2));
    store.getState().updateDrag(cell(2, 2));
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("left");
    expect(arrow.position.equals(cell(2, 2))).toBe(true);
    expect(arrow.size.equals(Size.create(5, 1))).toBe(true);
  });

  test("an arrow placement drag upwards flips vertical and points up", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("arrow", cell(3, 6));
    store.getState().updateDrag(cell(3, 2));
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("up");
    expect(arrow.position.equals(cell(3, 2))).toBe(true);
    expect(arrow.size.equals(Size.create(1, 5))).toBe(true);
  });

  test("an arrow placement drag downwards flips vertical and points down", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("arrow", cell(1, 1));
    store.getState().updateDrag(cell(1, 5));
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("down");
    expect(arrow.position.equals(cell(1, 1))).toBe(true);
    expect(arrow.size.equals(Size.create(1, 5))).toBe(true);
  });

  test("resizing a right arrow downwards flips it to a down arrow in one undo", async () => {
    await openFixtureDoc();
    store.getState().placeElement("arrow", cell(0, 0)); // id-1: 6×1 right

    store.getState().beginResize("id-1", cell(5, 0));
    store.getState().updateDrag(cell(5, 3)); // 3 cells down
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("down");
    expect(arrow.size.equals(Size.create(1, 4))).toBe(true);

    store.getState().undo(); // one snapshot restores size AND direction
    const restored = store
      .getState()
      .document!.getElement("id-1") as ArrowElement;
    expect(restored.direction).toBe("right");
    expect(restored.size.equals(Size.create(6, 1))).toBe(true);
  });

  test("widening a right arrow one cell down keeps it pointing right", async () => {
    await openFixtureDoc();
    store.getState().placeElement("arrow", cell(0, 0)); // id-1: 6×1 right

    store.getState().beginResize("id-1", cell(5, 0));
    store.getState().updateDrag(cell(8, 1)); // +3 cols, +1 row
    store.getState().commitDrag();

    const arrow = store.getState().document!.getElement("id-1") as ArrowElement;
    expect(arrow.direction).toBe("right");
    // Height collapses to the arrow's canonical 1; width grows.
    expect(arrow.size.equals(Size.create(9, 1))).toBe(true);
  });

  test("starting a placement drag clears the previous selection until commit", async () => {
    await openFixtureDoc();
    store.getState().placeElement("box", cell(0, 0)); // id-1, selected
    expect(store.getState().selectedElementIds).toEqual(["id-1"]);

    store.getState().beginPlacement("box", cell(4, 4));
    // Nothing stays selected mid-gesture: id-1's overlay must not linger
    // over the canvas while the new box is being sized.
    expect(store.getState().selectedElementIds).toEqual([]);

    store.getState().updateDrag(cell(8, 7));
    store.getState().commitDrag();
    expect(store.getState().selectedElementIds).toEqual(["id-2"]);
  });

  test("text placement enters inline editing only after pointer up", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("text", cell(1, 1));
    expect(store.getState().canvasEditingElementId).toBeNull();

    store.getState().commitDrag();
    const state = store.getState();
    expect(state.canvasEditingElementId).toBe("id-1");
    expect(state.textEditingElementId).toBe("id-1");
  });

  test("cancelling a placement gesture creates nothing", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("box", cell(0, 0));
    store.getState().updateDrag(cell(3, 3));
    store.getState().cancelDrag();

    expect(store.getState().drag).toBeNull();
    expect(store.getState().document!.elements).toHaveLength(0);
    expect(store.getState().canUndo).toBe(false);
  });

  test("previewedDocument shows the placement ghost before it is committed", async () => {
    await openFixtureDoc();

    store.getState().beginPlacement("box", cell(1, 1));
    store.getState().updateDrag(cell(3, 3));

    const state = store.getState();
    const ghost = previewedDocument(state.document!, state.drag).getElement(
      "id-1",
    )!;
    expect(ghost.position.equals(cell(1, 1))).toBe(true);
    expect(ghost.size.equals(Size.create(3, 3))).toBe(true);
    expect(state.document!.getElement("id-1")).toBeUndefined();
  });

  test("a placement gesture runs addElement exactly once", async () => {
    await openFixtureDoc();
    const addSpy = vi.spyOn(container.addElement, "execute");

    store.getState().beginPlacement("box", cell(0, 0));
    store.getState().updateDrag(cell(2, 2));
    store.getState().updateDrag(cell(4, 4));
    store.getState().commitDrag();

    expect(addSpy).toHaveBeenCalledTimes(1);
  });

  test("previewedDocument ignores a placement whose id already exists", async () => {
    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document!;
    const drag: DragState = {
      mode: "place",
      kind: "box",
      elementId: "b1", // collides with the existing element
      startCell: cell(0, 0),
      lastCell: cell(2, 2),
    };

    // addElement throws on the duplicate id, so the ghost is dropped.
    expect(previewedDocument(document, drag).elements).toHaveLength(1);
  });

  test("previewedDocument resize drag on an unknown element is a no-op", async () => {
    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document!;
    const drag: DragState = {
      mode: "resize",
      elementId: "ghost",
      startCell: cell(0, 0),
      lastCell: cell(3, 3),
      originPosition: cell(0, 0),
      originSize: Size.create(2, 2),
    };

    const preview = previewedDocument(document, drag);
    expect(preview.getElement("b1")?.size.equals(Size.create(2, 2))).toBe(true);
    expect(preview.getElement("ghost")).toBeUndefined();
  });

  test("a drag that returns to the start cell commits nothing", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().beginMove(["b1"], cell(1, 1));
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

    store.getState().beginMove(["b1"], cell(0, 0));
    store.getState().cancelDrag();

    expect(store.getState().drag).toBeNull();
  });

  test("beginMove on an unknown element names it in the error", async () => {
    await openFixtureDoc(makeBox("b1"));

    expect(() => store.getState().beginMove(["ghost"], cell(0, 0))).toThrow(
      ElementNotFoundError,
    );
  });
});

describe("pointer routing and tools", () => {
  test("select tool: down on an element selects it and dragging moves it", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().pointerDownOnCell(cell(1, 1));
    expect(store.getState().selectedElementIds).toEqual(["b1"]);

    store.getState().pointerMoveOnCell(cell(4, 4));
    store.getState().pointerUpOnCell(cell(4, 4));
    expect(
      store.getState().document?.getElement("b1")?.position.equals(cell(3, 3)),
    ).toBe(true);
  });

  test("select tool: clicking empty space clears the selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().pointerDownOnCell(cell(9, 9));
    store.getState().pointerUpOnCell(cell(9, 9));

    expect(store.getState().selectedElementIds).toEqual([]);
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
    store.getState().beginMove(["b1"], cell(0, 0));

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
      "input",
      "dropdown",
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

    expect(buffer.charAt(cell(0, 0))).toBe("┌");
    expect(buffer.charAt(cell(1, 1))).toBe("┘");
  });

  test("exportAscii returns the exact raw string", async () => {
    await openFixtureDoc(makeBox("b1"));

    const ascii = store.getState().exportAscii();
    const lines = ascii.split("\n");

    expect(lines).toHaveLength(10);
    expect(lines[0].startsWith("┌┐")).toBe(true);
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
    store
      .getState()
      .beginPan({ clientX: 0, clientY: 0, button: 0, shiftKey: false });

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

    store.getState().pointerDownOnCell(cell(0, 0), {
      clientX: 100,
      clientY: 200,
      button: 0,
      shiftKey: false,
    });
    store.getState().pointerMoveOnCell(cell(0, 0), {
      clientX: 110,
      clientY: 210,
      button: -1,
      shiftKey: false,
    });
    store.getState().pointerUpOnCell(cell(0, 0), {
      clientX: 110,
      clientY: 210,
      button: 0,
      shiftKey: false,
    });

    expect(store.getState().viewport.offsetX).toBe(10);
    expect(store.getState().viewport.offsetY).toBe(10);
    expect(store.getState().panDrag).toBeNull();
  });
});

describe("hand/pan", () => {
  test("beginPan/updatePan/endPan moves the viewport", () => {
    store
      .getState()
      .beginPan({ clientX: 100, clientY: 200, button: 1, shiftKey: false });
    expect(store.getState().panDrag).not.toBeNull();

    store
      .getState()
      .updatePan({ clientX: 110, clientY: 205, button: -1, shiftKey: false });
    expect(store.getState().viewport.offsetX).toBe(10);
    expect(store.getState().viewport.offsetY).toBe(5);

    store.getState().endPan();
    expect(store.getState().panDrag).toBeNull();
  });

  test("updatePan without an active panDrag is a no-op", () => {
    store
      .getState()
      .updatePan({ clientX: 100, clientY: 200, button: -1, shiftKey: false });
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
      selectedElementOf({ document: null, selectedElementIds: ["b1"] }),
    ).toBeNull();

    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document;
    expect(selectedElementOf({ document, selectedElementIds: [] })).toBeNull();
    expect(
      selectedElementOf({ document, selectedElementIds: ["b1", "b2"] }),
    ).toBeNull(); // null with 2 selected
    expect(
      selectedElementOf({ document, selectedElementIds: ["ghost"] }),
    ).toBeNull();
    expect(
      selectedElementOf({ document, selectedElementIds: ["b1"] })?.id,
    ).toBe("b1");
  });

  test("selectedElementsOf returns all valid selected elements", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    const document = store.getState().document;

    const result = selectedElementsOf({
      document,
      selectedElementIds: ["b1", "b2", "ghost"],
    });
    expect(result.map((e) => e.id)).toEqual(["b1", "b2"]);
    expect(
      selectedElementsOf({ document: null, selectedElementIds: [] }),
    ).toEqual([]);
  });

  test("previewedDocument move drag with unknown elementId skips that element", async () => {
    await openFixtureDoc(makeBox("b1"));
    const document = store.getState().document!;
    const drag: DragState = {
      mode: "move",
      elementIds: ["b1", "ghost"],
      startCell: cell(0, 0),
      lastCell: cell(1, 0),
      originPositions: new Map([["b1", cell(0, 0)]]),
      // "ghost" is intentionally absent from originPositions
    };

    const preview = previewedDocument(document, drag, null);

    expect(preview.getElement("b1")?.position.col).toBe(1);
    expect(preview.getElement("ghost")).toBeUndefined();
  });

  test("marqueeRect normalises inverted drags", () => {
    const marquee: MarqueeState = {
      startCell: cell(5, 3),
      lastCell: cell(2, 1),
    };
    const rect = marqueeRect(marquee);
    expect(rect.position.equals(cell(2, 1))).toBe(true);
    expect(rect.size.width).toBe(4);
    expect(rect.size.height).toBe(3);
  });

  test("previewedDocument with paste preview ghost shows elements at anchor", async () => {
    await openFixtureDoc();
    const doc = store.getState().document!;
    const box = makeBox("b1");
    const preview = previewedDocument(doc, null, null, {
      elements: [box.translate(0, 0)],
      anchorCell: cell(3, 2),
    });
    // Ghost element at anchor offset
    expect(preview.elements).toHaveLength(1);
    expect(preview.getElement("b1")?.position.col).toBe(3);
    expect(preview.getElement("b1")?.position.row).toBe(2);
  });

  test("previewedDocument with anchorCell null returns document unchanged", async () => {
    await openFixtureDoc(makeBox("b1"));
    const doc = store.getState().document!;
    const preview = previewedDocument(doc, null, null, {
      elements: [makeBox("b2")],
      anchorCell: null,
    });
    expect(preview).toBe(doc);
  });
});

describe("copy / paste / duplicate", () => {
  test("copySelection fills clipboard with the selected elements", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().selectElement("b1");

    store.getState().copySelection();

    expect(store.getState().clipboard).toHaveLength(1);
    expect(store.getState().clipboard[0].id).toBe("b1");
  });

  test("copySelection with empty selection keeps the previous clipboard", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().copySelection();
    store.getState().selectElement(null);

    store.getState().copySelection();

    expect(store.getState().clipboard).toHaveLength(1);
  });

  test("duplicateSelection places clones at +1,+1 with new ids", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().duplicateSelection();

    const state = store.getState();
    expect(state.document?.elements).toHaveLength(2);
    const cloneId = state.selectedElementIds[0];
    expect(cloneId).not.toBe("b1");
    const clone = state.document?.getElement(cloneId);
    expect(clone?.position.col).toBe(1);
    expect(clone?.position.row).toBe(1);
  });

  test("duplicateSelection pushes exactly 1 history snapshot", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().replaceSelection(["b1", "b2"]);
    const undoBefore = store.getState().canUndo;

    store.getState().duplicateSelection();

    expect(store.getState().canUndo).toBe(true);
    // canUndo changes from false to true = 1 push
    expect(undoBefore).toBe(false);
    store.getState().undo();
    expect(store.getState().document?.elements).toHaveLength(2);
    expect(store.getState().canUndo).toBe(false);
  });

  test("duplicateSelection with empty selection is a no-op", async () => {
    await openFixtureDoc(makeBox("b1"));

    store.getState().duplicateSelection();

    expect(store.getState().document?.elements).toHaveLength(1);
    expect(store.getState().canUndo).toBe(false);
  });

  test("beginPastePreview normalizes clones and sets anchorCell", async () => {
    await openFixtureDoc();
    const b1 = makeBox("b1");
    // Two boxes at (3,2) and (5,4)
    const b1Moved = b1.translate(3, 2);
    const b2Moved = makeBox("b2").translate(5, 4);
    store.getState().selectElement(null);
    store.setState({ clipboard: [b1Moved, b2Moved] });

    store.getState().beginPastePreview(cell(1, 1));

    const { pastePreview } = store.getState();
    expect(pastePreview).not.toBeNull();
    const positions = pastePreview!.elements.map((el) => ({
      col: el.position.col,
      row: el.position.row,
    }));
    // Normalized: top-left of bounding box moved to (0,0)
    expect(positions).toContainEqual({ col: 0, row: 0 });
    expect(positions).toContainEqual({ col: 2, row: 2 });
    expect(pastePreview!.anchorCell).toEqual(cell(1, 1));
    // Fresh ids
    expect(pastePreview!.elements[0].id).not.toBe("b1");
    expect(pastePreview!.elements[1].id).not.toBe("b2");
  });

  test("beginPastePreview with null anchorCell sets anchorCell to null", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });

    store.getState().beginPastePreview(null);

    expect(store.getState().pastePreview?.anchorCell).toBeNull();
  });

  test("beginPastePreview closes the context menu", async () => {
    await openFixtureDoc();
    store.setState({
      clipboard: [makeBox("b1")],
      contextMenu: { clientX: 10, clientY: 10, cell: null, target: "element" },
    });

    store.getState().beginPastePreview(null);

    expect(store.getState().contextMenu).toBeNull();
  });

  test("beginPastePreview with empty clipboard is a no-op", async () => {
    await openFixtureDoc();

    store.getState().beginPastePreview(null);

    expect(store.getState().pastePreview).toBeNull();
  });

  test("updatePastePreview updates the anchorCell", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(cell(0, 0));

    store.getState().updatePastePreview(cell(5, 3));

    expect(store.getState().pastePreview?.anchorCell).toEqual(cell(5, 3));
  });

  test("updatePastePreview with no preview is a no-op", async () => {
    await openFixtureDoc();
    store.getState().updatePastePreview(cell(5, 5));
    expect(store.getState().pastePreview).toBeNull();
  });

  test("cancelPastePreview clears the preview", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(cell(0, 0));

    store.getState().cancelPastePreview();

    expect(store.getState().pastePreview).toBeNull();
  });

  test("commitPastePreview adds elements at anchor, 1 undo push, selection = placed ids", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(null);
    store.getState().updatePastePreview(cell(4, 2));

    store.getState().commitPastePreview(cell(4, 2));

    const state = store.getState();
    expect(state.document?.elements).toHaveLength(1);
    const placed = state.document!.elements[0];
    expect(placed.position.col).toBe(4);
    expect(placed.position.row).toBe(2);
    expect(state.selectedElementIds).toEqual([placed.id]);
    expect(state.pastePreview).toBeNull();
    expect(state.canUndo).toBe(true);
  });

  test("commitPastePreview second paste generates new ids", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });

    store.getState().beginPastePreview(null);
    store.getState().commitPastePreview(cell(0, 0));
    const firstId = store.getState().selectedElementIds[0];

    store.getState().beginPastePreview(null);
    store.getState().commitPastePreview(cell(2, 2));
    const secondId = store.getState().selectedElementIds[0];

    expect(firstId).not.toBe(secondId);
    expect(store.getState().document?.elements).toHaveLength(2);
  });

  test("commitPastePreview with no active preview is a no-op", async () => {
    await openFixtureDoc();
    store.getState().commitPastePreview(cell(0, 0));
    expect(store.getState().document?.elements).toHaveLength(0);
  });

  test("pointer left-click during paste preview commits it", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(null);

    store.getState().pointerDownOnCell(cell(3, 3), {
      clientX: 0,
      clientY: 0,
      button: 0,
      shiftKey: false,
    });

    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(1);
  });

  test("pointer right-click during paste preview cancels it", async () => {
    await openFixtureDoc();
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(null);

    store.getState().pointerDownOnCell(cell(3, 3), {
      clientX: 0,
      clientY: 0,
      button: 2,
      shiftKey: false,
    });

    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(0);
  });

  test("pointer move during paste preview updates anchor without routing to tool", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.setState({ clipboard: [makeBox("b2")] });
    store.getState().beginPastePreview(null);

    store.getState().pointerMoveOnCell(cell(5, 3), {
      clientX: 0,
      clientY: 0,
      button: -1,
      shiftKey: false,
    });

    expect(store.getState().pastePreview?.anchorCell).toEqual(cell(5, 3));
    // No drag started (tool not routed)
    expect(store.getState().drag).toBeNull();
  });

  test("applyKeyAction copy/paste/duplicate/cancel are routed correctly", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");

    store.getState().applyKeyAction({ type: "copy" });
    expect(store.getState().clipboard).toHaveLength(1);

    store.getState().applyKeyAction({ type: "paste" });
    expect(store.getState().pastePreview).not.toBeNull();

    store.getState().applyKeyAction({ type: "cancel" });
    expect(store.getState().pastePreview).toBeNull();

    store.getState().applyKeyAction({ type: "duplicate" });
    expect(store.getState().document?.elements).toHaveLength(2);
  });

  test("applyKeyAction select-all selects every element and closes the inspector", async () => {
    await openFixtureDoc(makeBox("b1"), makeBox("b2"));
    store.getState().selectElement("b1");
    store.getState().openInspector();

    store.getState().applyKeyAction({ type: "select-all" });

    expect(store.getState().selectedElementIds).toEqual(["b1", "b2"]);
    expect(store.getState().inspectorOpen).toBe(false);
  });

  test("applyKeyAction Delete during paste preview cancels preview, not removes selection", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(null);

    store.getState().applyKeyAction({ type: "remove-selected" });

    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(1); // NOT deleted
  });

  test("Escape precedence: contextMenu → pastePreview → drag", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    // Directly set both active simultaneously to test priority
    store.setState({
      clipboard: [makeBox("b1")],
      pastePreview: { elements: [makeBox("id-x")], anchorCell: null },
      contextMenu: { clientX: 0, clientY: 0, cell: null, target: "element" },
    });

    // First Escape closes context menu, paste preview untouched
    store.getState().applyKeyAction({ type: "cancel" });
    expect(store.getState().contextMenu).toBeNull();
    expect(store.getState().pastePreview).not.toBeNull();

    // Second Escape cancels paste preview
    store.getState().applyKeyAction({ type: "cancel" });
    expect(store.getState().pastePreview).toBeNull();
  });

  test("applyKeyAction copy/paste/duplicate suspended during text editing", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.setState({ textEditingElementId: "b1", clipboard: [makeBox("b1")] });

    store.getState().applyKeyAction({ type: "copy" });
    store.getState().applyKeyAction({ type: "paste" });
    store.getState().applyKeyAction({ type: "duplicate" });
    store.getState().applyKeyAction({ type: "select-all" });

    expect(store.getState().clipboard).toHaveLength(1); // unchanged
    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().document?.elements).toHaveLength(1);
    expect(store.getState().textEditingElementId).toBe("b1"); // still editing
  });

  test("openDocument preserves clipboard but clears preview and menu", async () => {
    const b1 = makeBox("b1");
    store.setState({ clipboard: [b1] });

    await openFixtureDoc();

    expect(store.getState().clipboard).toHaveLength(1);
    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().contextMenu).toBeNull();
  });

  test("setActiveTool clears pastePreview and contextMenu", async () => {
    await openFixtureDoc();
    store.setState({
      clipboard: [makeBox("b1")],
      contextMenu: { clientX: 0, clientY: 0, cell: null, target: "element" },
    });
    store.getState().beginPastePreview(null);

    store.getState().setActiveTool("box");

    expect(store.getState().pastePreview).toBeNull();
    expect(store.getState().contextMenu).toBeNull();
  });

  test("openContextMenu and closeContextMenu", async () => {
    await openFixtureDoc();

    store.getState().openContextMenu({
      clientX: 50,
      clientY: 80,
      cell: null,
      target: "element",
    });
    expect(store.getState().contextMenu).toEqual({
      clientX: 50,
      clientY: 80,
      cell: null,
      target: "element",
    });

    store.getState().closeContextMenu();
    expect(store.getState().contextMenu).toBeNull();
  });

  test("pointer down with open context menu closes it first", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.setState({
      contextMenu: { clientX: 0, clientY: 0, cell: null, target: "element" },
    });

    store.getState().pointerDownOnCell(cell(5, 5));

    expect(store.getState().contextMenu).toBeNull();
  });

  test("Escape cancels drag when no contextMenu or pastePreview", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().beginMove(["b1"], cell(0, 0));
    expect(store.getState().drag).not.toBeNull();

    store.getState().applyKeyAction({ type: "cancel" });

    expect(store.getState().drag).toBeNull();
  });

  test("Escape cancels marquee when no contextMenu, pastePreview, or drag", async () => {
    await openFixtureDoc();
    store.getState().beginMarquee(cell(0, 0));
    expect(store.getState().marquee).not.toBeNull();

    store.getState().applyKeyAction({ type: "cancel" });

    expect(store.getState().marquee).toBeNull();
  });

  test("Escape cancels stroke when no higher-priority interaction is active", async () => {
    await openFixtureDoc();
    store.getState().setActiveTool("pencil");
    store.getState().beginDrawStroke(cell(1, 1));
    expect(store.getState().stroke).not.toBeNull();

    store.getState().applyKeyAction({ type: "cancel" });

    expect(store.getState().stroke).toBeNull();
  });

  test("Escape with no active interaction is a no-op", async () => {
    await openFixtureDoc();

    // Should not throw; all guards are null, nothing to cancel
    expect(() =>
      store.getState().applyKeyAction({ type: "cancel" }),
    ).not.toThrow();
    expect(store.getState().drag).toBeNull();
    expect(store.getState().marquee).toBeNull();
    expect(store.getState().stroke).toBeNull();
  });
});

describe("same-cell pointer moves publish no new state", () => {
  // Pointer moves fire per pixel; these guards keep the store (and therefore
  // every subscribed component) quiet until the cursor crosses a cell boundary.

  test("updateMarquee with the current lastCell keeps the same state object", async () => {
    await openFixtureDoc();
    store.getState().beginMarquee(cell(2, 2));
    store.getState().updateMarquee(cell(5, 4));
    const before = store.getState().marquee;

    store.getState().updateMarquee(cell(5, 4));

    expect(store.getState().marquee).toBe(before);
  });

  test("updateDrag (resize) with the current lastCell keeps the same state object", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginResize("b1", cell(3, 2));
    store.getState().updateDrag(cell(6, 5));
    const before = store.getState().drag;

    store.getState().updateDrag(cell(6, 5));

    expect(store.getState().drag).toBe(before);
  });

  test("updatePastePreview with the current anchorCell keeps the same state object", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().copySelection();
    store.getState().beginPastePreview(null);
    store.getState().updatePastePreview(cell(4, 3)); // null anchor → still sets
    const before = store.getState().pastePreview;

    store.getState().updatePastePreview(cell(4, 3));

    expect(store.getState().pastePreview).toBe(before);
  });

  test("extendStroke re-stamping the same char on the same cell keeps the same state object", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(1, 1));
    const before = store.getState().stroke;

    store.getState().extendStroke(cell(1, 1));

    expect(store.getState().stroke).toBe(before);
  });

  test("extendStroke with a different pencil char overwrites the same cell", async () => {
    await openFixtureDoc();
    store.getState().beginDrawStroke(cell(1, 1));
    store.getState().setPencilChar("#");

    store.getState().extendStroke(cell(1, 1));

    const { stroke } = store.getState();
    expect(stroke?.mode).toBe("draw");
    if (stroke?.mode === "draw") {
      expect(stroke.cells.get("1,1")?.value).toBe("#");
    }
  });

  test("extendStroke re-erasing the same cell keeps the same state object", async () => {
    await openFixtureDoc(makeFD("fd1"));
    store.getState().beginEraseStroke(cell(0, 0));
    const before = store.getState().stroke;

    store.getState().extendStroke(cell(0, 0));

    expect(store.getState().stroke).toBe(before);
  });
});

describe("canvas resize", () => {
  /** A reference frame of 200×180px paper over a 20×10 grid (10×18px cells). */
  const fixtureDragRef = {
    originLeft: 0,
    originTop: 0,
    cellWidthPx: 10,
    cellHeightPx: 18,
  };

  test("beginCanvasResize opens the selector seeded at the current grid size", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().selectElement("b1");
    store.getState().openInspector();

    store.getState().beginCanvasResize();

    const { canvasResize } = store.getState();
    expect(canvasResize).not.toBeNull();
    expect(canvasResize!.previewSize.equals(GridSize.create(20, 10))).toBe(
      true,
    );
    expect(canvasResize!.drag).toBeNull();
    // Clears other interactions so only the resize overlay is live.
    expect(store.getState().selectedElementIds).toEqual([]);
    expect(store.getState().inspectorOpen).toBe(false);
  });

  test("beginCanvasResize throws when no document is open", () => {
    expect(() => store.getState().beginCanvasResize()).toThrow(
      NoOpenDocumentError,
    );
  });

  test("a handle drag previews the new size against the fixed reference frame", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);

    // Pointer at 300px → 30 cols; 90px → 5 rows.
    store.getState().updateCanvasResizeDrag({ clientX: 300, clientY: 90 });

    expect(
      store.getState().canvasResize!.previewSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
    // The document is untouched until commit.
    expect(
      store.getState().document!.gridSize.equals(GridSize.create(20, 10)),
    ).toBe(true);
  });

  test("the previewed size floors at 1×1", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);

    store.getState().updateCanvasResizeDrag({ clientX: -50, clientY: -50 });

    expect(
      store.getState().canvasResize!.previewSize.equals(GridSize.create(1, 1)),
    ).toBe(true);
  });

  test("beginCanvasResizeDrag is a no-op when the selector is closed", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResizeDrag(fixtureDragRef);
    expect(store.getState().canvasResize).toBeNull();
  });

  test("updateCanvasResizeDrag is a no-op without an active handle drag", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    const before = store.getState().canvasResize;

    store.getState().updateCanvasResizeDrag({ clientX: 300, clientY: 90 });

    expect(store.getState().canvasResize).toBe(before);
  });

  test("updateCanvasResizeDrag on the same cell keeps the same state object", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);
    // 200px / 10 = 20 cols, 180px / 18 = 10 rows → same as current preview.
    store.getState().updateCanvasResizeDrag({ clientX: 200, clientY: 180 });
    const before = store.getState().canvasResize;

    store.getState().updateCanvasResizeDrag({ clientX: 200, clientY: 180 });

    expect(store.getState().canvasResize).toBe(before);
  });

  test("endCanvasResizeDrag clears the handle drag but keeps the preview open", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);
    store.getState().updateCanvasResizeDrag({ clientX: 300, clientY: 90 });

    store.getState().endCanvasResizeDrag();

    expect(store.getState().canvasResize!.drag).toBeNull();
    expect(
      store.getState().canvasResize!.previewSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });

  test("endCanvasResizeDrag is a no-op when the selector is closed", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().endCanvasResizeDrag();
    expect(store.getState().canvasResize).toBeNull();
  });

  test("commitCanvasResize applies the previewed size with one undo snapshot", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);
    store.getState().updateCanvasResizeDrag({ clientX: 300, clientY: 90 });

    store.getState().commitCanvasResize();

    expect(store.getState().canvasResize).toBeNull();
    expect(
      store.getState().document!.gridSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(
      store.getState().document!.gridSize.equals(GridSize.create(20, 10)),
    ).toBe(true);
  });

  test("commitCanvasResize with an unchanged size records no snapshot", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();

    store.getState().commitCanvasResize();

    expect(store.getState().canvasResize).toBeNull();
    expect(store.getState().canUndo).toBe(false);
  });

  test("commitCanvasResize is a no-op when the selector is closed", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().commitCanvasResize();
    expect(store.getState().canUndo).toBe(false);
  });

  test("cancelCanvasResize discards the preview, leaving the grid unchanged", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().beginCanvasResize();
    store.getState().beginCanvasResizeDrag(fixtureDragRef);
    store.getState().updateCanvasResizeDrag({ clientX: 300, clientY: 90 });

    store.getState().cancelCanvasResize();

    expect(store.getState().canvasResize).toBeNull();
    expect(
      store.getState().document!.gridSize.equals(GridSize.create(20, 10)),
    ).toBe(true);
    expect(store.getState().canUndo).toBe(false);
  });
});

describe("placement hover ghost", () => {
  test("previewPlacementHover parks a default-size ghost under the cursor", async () => {
    await openFixtureDoc();

    store.getState().previewPlacementHover("box", cell(2, 1));

    expect(store.getState().placementHover).toEqual({
      kind: "box",
      cell: cell(2, 1),
      borderStyle: BorderStyle.square(),
    });
  });

  test("previewedDocument renders the hover ghost on top of existing elements", async () => {
    await openFixtureDoc(makeBox("b1"));
    const doc = store.getState().document!;

    const preview = previewedDocument(doc, null, null, null, {
      kind: "text",
      cell: cell(3, 2),
    });

    const ghost = preview.getElement("__placement_preview__");
    expect(ghost?.position.equals(cell(3, 2))).toBe(true);
    expect(ghost!.zIndex).toBeGreaterThan(doc.getElement("b1")!.zIndex);
  });

  test("previewedDocument without a hover ghost returns the document untouched", async () => {
    await openFixtureDoc(makeBox("b1"));
    const doc = store.getState().document!;

    expect(previewedDocument(doc, null, null, null, null)).toBe(doc);
  });

  test("previewedDocument ignores a hover ghost whose id already exists", async () => {
    await openFixtureDoc(makeBox("__placement_preview__"));
    const doc = store.getState().document!;

    const preview = previewedDocument(doc, null, null, null, {
      kind: "box",
      cell: cell(1, 1),
    });

    expect(preview.elements).toHaveLength(1);
  });

  test("previewPlacementHover yields to an active drag", async () => {
    await openFixtureDoc();
    store.getState().beginPlacement("box", cell(0, 0));

    store.getState().previewPlacementHover("box", cell(2, 2));

    expect(store.getState().placementHover).toBeNull();
  });

  test("previewPlacementHover yields to an active paste preview", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.setState({ clipboard: [makeBox("b1")] });
    store.getState().beginPastePreview(cell(0, 0));

    store.getState().previewPlacementHover("box", cell(2, 2));

    expect(store.getState().placementHover).toBeNull();
  });

  test("previewPlacementHover skips a repeat of the same kind and cell", async () => {
    await openFixtureDoc();
    store.getState().previewPlacementHover("box", cell(2, 2));
    const first = store.getState().placementHover;

    store.getState().previewPlacementHover("box", cell(2, 2));

    // Same ghost: no new object was published (would cause a needless render).
    expect(store.getState().placementHover).toBe(first);
  });

  test("clearPlacementHover removes the ghost, and is a no-op when already clear", async () => {
    await openFixtureDoc();
    store.getState().previewPlacementHover("box", cell(2, 2));

    store.getState().clearPlacementHover();
    expect(store.getState().placementHover).toBeNull();

    // Second call must not throw or publish state again.
    store.getState().clearPlacementHover();
    expect(store.getState().placementHover).toBeNull();
  });

  test("switching tools clears the hover ghost", async () => {
    await openFixtureDoc();
    store.getState().previewPlacementHover("box", cell(2, 2));

    store.getState().setActiveTool("select");

    expect(store.getState().placementHover).toBeNull();
  });

  test("opening the canvas-resize selector clears the hover ghost", async () => {
    await openFixtureDoc(makeBox("b1"));
    store.getState().previewPlacementHover("box", cell(2, 2));

    store.getState().beginCanvasResize();

    expect(store.getState().placementHover).toBeNull();
  });
});

describe("default border style", () => {
  const placedElement = () => {
    const id = store.getState().selectedElementIds[0];
    return store.getState().document!.getElement(id)!;
  };

  test("defaults to square and setDefaultBorderStyleName changes it", () => {
    expect(store.getState().defaultBorderStyleName).toBe("square");
    store.getState().setDefaultBorderStyleName("rounded");
    expect(store.getState().defaultBorderStyleName).toBe("rounded");
  });

  test("placeElement stamps the current default onto a bordered element", async () => {
    await openFixtureDoc();
    store.getState().setDefaultBorderStyleName("cross");

    store.getState().placeElement("card", cell(0, 0));

    expect(placedElement().borderStyle.equals(BorderStyle.cross())).toBe(true);
  });

  test("a borderless element ignores the default and stays square", async () => {
    await openFixtureDoc();
    store.getState().setDefaultBorderStyleName("cross");

    store.getState().placeElement("line", cell(0, 0));

    const line = placedElement();
    expect(line.hasBorder).toBe(false);
    expect(line.borderStyle.equals(BorderStyle.square())).toBe(true);
  });

  test("a placement drag stamps the default onto the committed element", async () => {
    await openFixtureDoc();
    store.getState().setDefaultBorderStyleName("rounded");

    store.getState().beginPlacement("table", cell(1, 1));
    store.getState().updateDrag(cell(6, 5));
    store.getState().commitDrag();

    expect(placedElement().borderStyle.equals(BorderStyle.rounded())).toBe(
      true,
    );
  });
});
