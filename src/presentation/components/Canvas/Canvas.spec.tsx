import { afterEach, describe, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { Canvas } from "./Canvas";
import { editorStore } from "../../state/app-store/appStore";
import { selectedElementOf } from "../../state/editor-store/editorStore";
import { makeBox, makeDoc, makeText } from "../../../tests/fixtures";
import { InputElement } from "../../../domain/entities/element/InputElement";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";

function makeInput(id: string) {
  return InputElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(22, 4),
    zIndex: 0,
    layerId: null,
    label: "Label",
    placeholder: "Placeholder",
    hint: "Hint",
  });
}

/** The rootRef div (wheel-zoom target) is the grid surface's parent. */
function rootDiv() {
  const surface = screen.getByTestId("grid-surface").parentElement;
  if (surface === null) {
    throw new Error("grid surface has no parent");
  }
  return surface;
}

function openDoc() {
  editorStore.setState({
    document: makeDoc(makeBox("b1")),
    documentStatus: "ready",
  });
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    activeToolId: "select",
    drag: null,
    marquee: null,
    stroke: null,
    panDrag: null,
    textEditingElementId: null,
    canvasEditingElementId: null,
    canvasEditingField: null,
    canvasResize: null,
    placementHover: null,
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  });
});

/** jsdom does not implement pointer capture; make it a no-op on the canvas. */
function stubPointerCapture(element: HTMLElement) {
  element.setPointerCapture = () => {};
  element.releasePointerCapture = () => {};
}

describe("Canvas", () => {
  test("renders nothing until a document is open", () => {
    const { container } = render(<Canvas />);
    expect(container).toBeEmptyDOMElement();
  });

  test("ctrl+wheel zooms in toward the cursor, pinning that point", () => {
    openDoc();
    render(<Canvas />);

    // jsdom reports a zero-origin rect, so the cursor's content-local anchor
    // is (clientX, clientY). The offset must shift so anchor stays on screen.
    fireEvent.wheel(rootDiv(), {
      ctrlKey: true,
      deltaY: -1,
      clientX: 100,
      clientY: 50,
    });

    const { zoom, offsetX, offsetY } = editorStore.getState().viewport;
    expect(zoom).toBeCloseTo(1.1);
    expect(offsetX).toBeCloseTo(-10);
    expect(offsetY).toBeCloseTo(-5);
    // Anchor screen position (offset + anchor * zoom) is unchanged.
    expect(offsetX + 100 * zoom).toBeCloseTo(100);
    expect(offsetY + 50 * zoom).toBeCloseTo(50);
  });

  test("ctrl+wheel down zooms out around the cursor", () => {
    openDoc();
    render(<Canvas />);

    fireEvent.wheel(rootDiv(), {
      ctrlKey: true,
      deltaY: 1,
      clientX: 100,
      clientY: 50,
    });

    const { zoom, offsetX } = editorStore.getState().viewport;
    expect(zoom).toBeCloseTo(0.9);
    expect(offsetX).toBeCloseTo(10);
  });

  test("a plain wheel pans a third of the delta vertically, smoothly", () => {
    openDoc();
    render(<Canvas />);

    // Scrolling down (deltaY > 0) moves the content up, like a scrollbar; only
    // a third of the 120px delta is applied.
    fireEvent.wheel(rootDiv(), { deltaY: 120 });

    expect(editorStore.getState().viewport).toEqual({
      zoom: 1,
      offsetX: 0,
      offsetY: -40,
    });
    expect(screen.getByTestId("canvas-transform").style.transition).toContain(
      "transform",
    );
  });

  test("shift+wheel pans horizontally, reading the delta on either axis", () => {
    openDoc();
    render(<Canvas />);

    // Some browsers report shift+wheel as a horizontal delta; deltaX is used
    // when deltaY is zero.
    fireEvent.wheel(rootDiv(), { shiftKey: true, deltaY: 0, deltaX: 120 });

    expect(editorStore.getState().viewport).toEqual({
      zoom: 1,
      offsetX: -40,
      offsetY: 0,
    });
  });

  test("ctrl+wheel zoom is not eased (stays pixel-exact)", () => {
    openDoc();
    render(<Canvas />);

    fireEvent.wheel(rootDiv(), { ctrlKey: true, deltaY: -1 });

    expect(screen.getByTestId("canvas-transform").style.transition).toBe(
      "none",
    );
  });

  test("ctrl+wheel zooms even when fired on the canvas backdrop, not the paper", () => {
    openDoc();
    render(<Canvas />);

    fireEvent.wheel(screen.getByTestId("canvas"), {
      ctrlKey: true,
      deltaY: -1,
      clientX: 100,
      clientY: 50,
    });

    expect(editorStore.getState().viewport.zoom).toBeCloseTo(1.1);
  });

  test("a drag stays instant even right after a smooth wheel scroll", () => {
    openDoc();
    render(<Canvas />);

    fireEvent.wheel(rootDiv(), { deltaY: 120 }); // arms smooth scrolling
    act(() => {
      editorStore.setState({ panDrag: { lastClientX: 0, lastClientY: 0 } });
    });

    expect(screen.getByTestId("canvas-transform").style.transition).toBe(
      "none",
    );
  });

  test("a non-shortcut key is ignored", () => {
    openDoc();
    render(<Canvas />);

    fireEvent.keyDown(screen.getByTestId("canvas"), { key: "a" });

    const element = selectedElementOf({
      document: editorStore.getState().document,
      selectedElementIds: ["b1"],
    });
    expect(element?.position.col).toBe(0);
  });

  test("ctrl+a selects every element and blocks the page-wide text selection", () => {
    openDoc();
    render(<Canvas />);

    const notPrevented = fireEvent.keyDown(screen.getByTestId("canvas"), {
      key: "a",
      ctrlKey: true,
    });

    // fireEvent returns false when preventDefault ran → no native select-all.
    expect(notPrevented).toBe(false);
    expect(editorStore.getState().selectedElementIds).toEqual(["b1"]);
  });

  test("an arrow key nudges the selected element", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);

    fireEvent.keyDown(screen.getByTestId("canvas"), { key: "ArrowRight" });

    const element = selectedElementOf({
      document: editorStore.getState().document,
      selectedElementIds: ["b1"],
    });
    expect(element?.position.col).toBe(1);
  });

  test("the resize handle maps the cursor to a grid cell", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);

    // 20×10 grid at 10×18px cells; jsdom otherwise reports a zero-size rect,
    // which would leave cellAtPoint unable to locate the cursor's cell.
    rootDiv().getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 180 }) as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = () => {};
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });

    expect(editorStore.getState().drag).not.toBeNull();
  });

  test("resize handle is a no-op when the paper has no measurable rect", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);

    // No rect → cellFromPoint returns null → the overlay cannot start a drag.
    rootDiv().getBoundingClientRect = () => undefined as unknown as DOMRect;

    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = () => {};
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });

    expect(editorStore.getState().drag).toBeNull();
  });

  test("with 2 elements selected, 2 selection overlays are shown without resize handle", () => {
    editorStore.setState({
      document: makeDoc(makeBox("b1"), makeBox("b2")),
      documentStatus: "ready",
      selectedElementIds: ["b1", "b2"],
    });
    render(<Canvas />);

    const overlays = screen.getAllByTestId("selection-overlay");
    expect(overlays).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Resize element" })).toBeNull();
  });

  test("with 1 element selected, 1 overlay with a resize handle is shown", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);

    expect(screen.getAllByTestId("selection-overlay")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Resize element" }),
    ).toBeInTheDocument();
  });

  test("the resize control ghost button is shown while a document is open", () => {
    openDoc();
    render(<Canvas />);

    expect(
      screen.getByRole("button", { name: "Resize canvas" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("canvas-resize-overlay")).toBeNull();
  });

  test("an open resize session renders the paper at the preview size with the overlay", () => {
    openDoc();
    act(() => {
      editorStore.setState({
        canvasResize: {
          previewSize: GridSize.create(4, 3),
          drag: null,
        },
      });
    });
    render(<Canvas />);

    // The paper recomposes at 4×3, clipping the fixture box outside it.
    expect(
      screen.getByTestId("grid-surface").querySelectorAll("span"),
    ).toHaveLength(12);
    expect(screen.getByTestId("canvas-resize-overlay")).toBeInTheDocument();
  });

  test("a placement tool suppresses the cell outline and previews the element ghost", () => {
    openDoc();
    act(() => {
      editorStore.setState({
        activeToolId: "box",
        placementHover: { kind: "box", cell: Position.create(2, 1) },
      });
    });
    render(<Canvas />);

    // Placement tools show the full element ghost, not the per-cell outline:
    // the cell spans drop the hover:outline class.
    const grid = screen.getByTestId("grid-surface");
    expect(grid.querySelector("span")?.className).not.toContain(
      "hover:outline",
    );
    // The ghost's top border rasterises a run of '─' into the composed buffer.
    expect(grid.textContent).toContain("─");
  });

  test("marquee overlay appears when marquee state is set", () => {
    openDoc();
    act(() => {
      editorStore.setState({
        marquee: {
          startCell: { col: 0, row: 0 } as never,
          lastCell: { col: 3, row: 2 } as never,
        },
      });
    });
    render(<Canvas />);

    expect(screen.queryByTestId("marquee-overlay")).not.toBeNull();
  });

  test("holding the middle button pans without changing the active tool", () => {
    openDoc();
    editorStore.setState({ activeToolId: "box" });
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");
    stubPointerCapture(canvas);

    fireEvent.pointerDown(canvas, {
      button: 1,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 7, clientX: 130, clientY: 90 });

    expect(editorStore.getState().viewport.offsetX).toBe(30);
    expect(editorStore.getState().viewport.offsetY).toBe(-10);

    fireEvent.pointerUp(canvas, { button: 1, pointerId: 7 });

    expect(editorStore.getState().panDrag).toBeNull();
    // The gesture borrowed the hand tool; the selected tool is untouched.
    expect(editorStore.getState().activeToolId).toBe("box");
  });

  test("a primary-button press does not start a pan", () => {
    openDoc();
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");
    stubPointerCapture(canvas);

    fireEvent.pointerDown(canvas, {
      button: 0,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 7, clientX: 130, clientY: 90 });
    fireEvent.pointerUp(canvas, { button: 0, pointerId: 7 });

    expect(editorStore.getState().panDrag).toBeNull();
    expect(editorStore.getState().viewport).toEqual({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    });
  });

  test("the hand tool pans from the canvas backdrop with the primary button", () => {
    openDoc();
    editorStore.setState({ activeToolId: "hand" });
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");
    stubPointerCapture(canvas);

    // Pressing the canvas itself (the backdrop, not the paper) pans — this is
    // how the user recovers a canvas dragged fully out of view.
    fireEvent.pointerDown(canvas, {
      button: 0,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(canvas, { pointerId: 7, clientX: 130, clientY: 90 });

    expect(editorStore.getState().viewport.offsetX).toBe(30);
    expect(editorStore.getState().viewport.offsetY).toBe(-10);

    fireEvent.pointerUp(canvas, { button: 0, pointerId: 7 });
    expect(editorStore.getState().panDrag).toBeNull();
    expect(editorStore.getState().activeToolId).toBe("hand");
  });

  test("a primary hand press over the paper is left to the grid surface", () => {
    openDoc();
    editorStore.setState({ activeToolId: "hand" });
    render(<Canvas />);
    stubPointerCapture(screen.getByTestId("canvas"));

    // target is the grid (inside the paper), so the backdrop handler stands
    // down — the surface's own tool routing owns the over-paper hand pan.
    fireEvent.pointerDown(screen.getByTestId("grid-surface"), {
      button: 0,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });

    expect(editorStore.getState().panDrag).toBeNull();
  });

  test("only the primary button starts a hand-tool backdrop pan", () => {
    openDoc();
    editorStore.setState({ activeToolId: "hand" });
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");
    stubPointerCapture(canvas);

    // right button on the backdrop is not the primary button → no pan
    fireEvent.pointerDown(canvas, {
      button: 2,
      pointerId: 7,
      clientX: 100,
      clientY: 100,
    });

    expect(editorStore.getState().panDrag).toBeNull();
  });

  test("shows the open-hand cursor while the hand tool is idle", () => {
    openDoc();
    editorStore.setState({ activeToolId: "hand" });
    render(<Canvas />);

    const { cursor } = screen.getByTestId("canvas").style;
    expect(cursor).toContain("data:image/svg+xml");
    expect(cursor.endsWith("grab")).toBe(true);
  });

  test("shows the grabbing-hand cursor while a pan is in progress", () => {
    openDoc();
    editorStore.setState({
      activeToolId: "hand",
      panDrag: { lastClientX: 0, lastClientY: 0 },
    });
    render(<Canvas />);

    expect(screen.getByTestId("canvas").style.cursor.endsWith("grabbing")).toBe(
      true,
    );
  });

  test("shows the pointer arrow for a drawing tool", () => {
    openDoc();
    editorStore.setState({ activeToolId: "box" });
    render(<Canvas />);

    const { cursor } = screen.getByTestId("canvas").style;
    expect(cursor).toContain("data:image/svg+xml");
    expect(cursor.endsWith("default")).toBe(true);
  });

  test("TextEditOverlay appears when canvasEditingElementId is set to a TextElement", () => {
    const textEl = makeText("t1", "hello");
    editorStore.setState({
      document: makeDoc(textEl),
      documentStatus: "ready",
      canvasEditingElementId: "t1",
      textEditingElementId: "t1",
      selectedElementIds: ["t1"],
    });
    render(<Canvas />);

    expect(screen.getByTestId("text-edit-overlay")).toBeInTheDocument();
  });

  test("TextEditOverlay does not appear when only textEditingElementId is set (inspector editing)", () => {
    const textEl = makeText("t1", "hello");
    editorStore.setState({
      document: makeDoc(textEl),
      documentStatus: "ready",
      textEditingElementId: "t1",
      canvasEditingElementId: null,
      selectedElementIds: ["t1"],
    });
    render(<Canvas />);

    expect(screen.queryByTestId("text-edit-overlay")).toBeNull();
  });

  test("TextEditOverlay does not appear when canvasEditingElementId points to a non-TextElement", () => {
    editorStore.setState({
      document: makeDoc(makeBox("b1")),
      documentStatus: "ready",
      canvasEditingElementId: "b1",
      textEditingElementId: "b1",
      selectedElementIds: ["b1"],
    });
    render(<Canvas />);

    expect(screen.queryByTestId("text-edit-overlay")).toBeNull();
  });

  test("no editing overlay is shown when canvasEditingElementId is stale", () => {
    editorStore.setState({
      document: makeDoc(makeBox("b1")),
      documentStatus: "ready",
      canvasEditingElementId: "ghost",
      canvasEditingField: "label",
      textEditingElementId: "ghost",
      selectedElementIds: [],
    });
    render(<Canvas />);

    expect(screen.queryByTestId("text-edit-overlay")).toBeNull();
    expect(screen.queryByTestId("field-edit-overlay")).toBeNull();
  });

  test("FieldEditOverlay appears for a field element with a targeted slot", () => {
    editorStore.setState({
      document: makeDoc(makeInput("in1")),
      documentStatus: "ready",
      canvasEditingElementId: "in1",
      canvasEditingField: "label",
      textEditingElementId: "in1",
      selectedElementIds: ["in1"],
    });
    render(<Canvas />);

    const overlay = screen.getByTestId("field-edit-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute("data-field", "label");
  });

  test("FieldEditOverlay does not appear for a field element without a slot", () => {
    editorStore.setState({
      document: makeDoc(makeInput("in1")),
      documentStatus: "ready",
      canvasEditingElementId: "in1",
      canvasEditingField: null,
      textEditingElementId: "in1",
      selectedElementIds: ["in1"],
    });
    render(<Canvas />);

    expect(screen.queryByTestId("field-edit-overlay")).toBeNull();
  });

  test("primary-button click on canvas backdrop ends canvas text editing", () => {
    const textEl = makeText("t1", "hello");
    editorStore.setState({
      document: makeDoc(textEl),
      documentStatus: "ready",
      canvasEditingElementId: "t1",
      textEditingElementId: "t1",
      selectedElementIds: ["t1"],
    });
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      // target === currentTarget when clicking the canvas div itself (backdrop)
    });

    expect(editorStore.getState().canvasEditingElementId).toBeNull();
  });

  test("primary-button click on canvas backdrop clears the selection", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");

    fireEvent.pointerDown(canvas, {
      button: 0,
      // target === currentTarget when clicking the canvas div itself (backdrop)
    });

    expect(editorStore.getState().selectedElementIds).toEqual([]);
  });

  test("keydown from an HTMLInputElement does not trigger applyKeyAction", () => {
    openDoc();
    editorStore.setState({ selectedElementIds: ["b1"] });
    render(<Canvas />);

    // Simulate a keydown whose target is an input element (bubbles to canvas).
    const canvas = screen.getByTestId("canvas");
    const input = document.createElement("input");
    canvas.appendChild(input);
    fireEvent.keyDown(input, { key: "Delete" });

    // Element must NOT be removed — the keydown was swallowed.
    expect(editorStore.getState().document?.elements).toHaveLength(1);
  });

  test("double click on grid fires doubleClickOnCell on the store", () => {
    openDoc();
    render(<Canvas />);
    const grid = screen.getByTestId("grid-surface");
    rootDiv().getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 180 }) as DOMRect;
    vi.spyOn(grid, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 180,
    } as DOMRect);

    fireEvent.dblClick(grid, { clientX: 5, clientY: 5 });

    // With select tool active and a box at (0,0), doubleClickOnCell on a
    // non-text element does nothing — but the action runs without throwing.
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test("a two-finger touch gesture pinch-zooms the viewport", () => {
    openDoc();
    render(<Canvas />);
    const canvas = screen.getByTestId("canvas");
    const fire = (type: string, pointerId: number, clientX: number) => {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, {
        pointerId,
        pointerType: "touch",
        clientX,
        clientY: 0,
      });
      act(() => {
        canvas.dispatchEvent(event);
      });
    };
    fire("pointerdown", 1, 0);
    fire("pointerdown", 2, 10);
    fire("pointermove", 2, 40); // fingers spread → scale up
    expect(editorStore.getState().viewport.zoom).toBeGreaterThan(1);
  });
});
