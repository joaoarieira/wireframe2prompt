import { afterEach, describe, expect, test } from "vitest";
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
import { makeBox, makeDoc } from "../../../tests/fixtures";

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
    selectedElementId: null,
    activeToolId: "select",
    drag: null,
    stroke: null,
    panDrag: null,
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
      selectedElementId: "b1",
    });
    expect(element?.position.col).toBe(0);
  });

  test("an arrow key nudges the selected element", () => {
    openDoc();
    editorStore.setState({ selectedElementId: "b1" });
    render(<Canvas />);

    fireEvent.keyDown(screen.getByTestId("canvas"), { key: "ArrowRight" });

    const element = selectedElementOf({
      document: editorStore.getState().document,
      selectedElementId: "b1",
    });
    expect(element?.position.col).toBe(1);
  });

  test("the resize handle maps the cursor to a grid cell", () => {
    openDoc();
    editorStore.setState({ selectedElementId: "b1" });
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

  test("shows a grab cursor while the hand tool is idle", () => {
    openDoc();
    editorStore.setState({ activeToolId: "hand" });
    render(<Canvas />);

    const { className } = screen.getByTestId("canvas");
    expect(className).toContain("cursor-grab");
    expect(className).not.toContain("cursor-grabbing");
  });

  test("shows a grabbing cursor while a pan is in progress", () => {
    openDoc();
    editorStore.setState({
      activeToolId: "hand",
      panDrag: { lastClientX: 0, lastClientY: 0 },
    });
    render(<Canvas />);

    expect(screen.getByTestId("canvas").className).toContain("cursor-grabbing");
  });

  test("shows no hand cursor for a drawing tool", () => {
    openDoc();
    editorStore.setState({ activeToolId: "box" });
    render(<Canvas />);

    expect(screen.getByTestId("canvas").className).not.toContain("cursor-grab");
  });
});
