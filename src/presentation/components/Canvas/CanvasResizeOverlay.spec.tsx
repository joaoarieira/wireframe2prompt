import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { CanvasResizeOverlay } from "./CanvasResizeOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    canvasResize: null,
  });
});

const previewSize = GridSize.create(20, 10);

/** A ref to a stand-in paper element reporting a 200×180px rect. */
function paperRef(rect?: Partial<DOMRect>) {
  const el = document.createElement("div");
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 180, ...rect }) as DOMRect;
  const ref = createRef<HTMLDivElement>();
  ref.current = el;
  return ref;
}

function openResizeSession() {
  editorStore.setState({
    document: makeDoc(makeBox("b1")),
    documentStatus: "ready",
    canvasResize: { previewSize, drag: null },
  });
}

describe("CanvasResizeOverlay", () => {
  test("renders the dashed frame and the resize handle", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );

    expect(screen.getByTestId("canvas-resize-overlay")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resize canvas" }),
    ).toBeInTheDocument();
  });

  test("the handle shows the themed resize cursor", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    expect(handle.style.cursor).toContain('url("data:image/svg+xml,');
    expect(handle.style.cursor.endsWith(", se-resize")).toBe(true);
  });

  test("pointer-down captures the reference frame and starts the handle drag", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    handle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });

    // 200px / 20 cols = 10px per column captured as the fixed frame.
    expect(editorStore.getState().canvasResize!.drag).toEqual({
      originLeft: 0,
      originTop: 0,
      cellWidthPx: 10,
      cellHeightPx: 18,
    });
  });

  test("pointer-down is a no-op when the paper has no measurable rect", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay
        previewSize={previewSize}
        canvasRef={paperRef({ width: 0, height: 0 })}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    handle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });

    expect(editorStore.getState().canvasResize!.drag).toBeNull();
  });

  test("pointer-down is a no-op when the paper ref is empty", () => {
    openResizeSession();
    const emptyRef = createRef<HTMLDivElement>();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={emptyRef} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    handle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });

    expect(editorStore.getState().canvasResize!.drag).toBeNull();
  });

  test("pointer-move during a drag previews the dragged-to size", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 200, clientY: 180 });

    // 300px / 10 = 30 cols; 90px / 18 = 5 rows.
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300, clientY: 90 });

    expect(
      editorStore
        .getState()
        .canvasResize!.previewSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });

  test("pointer-move without an active drag is a no-op", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });

    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300, clientY: 90 });

    expect(
      editorStore.getState().canvasResize!.previewSize.equals(previewSize),
    ).toBe(true);
  });

  test("pointer-up ends the handle drag", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(editorStore.getState().canvasResize!.drag).not.toBeNull();

    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(editorStore.getState().canvasResize!.drag).toBeNull();
  });

  test("pointer-up without an active drag is a no-op", () => {
    openResizeSession();
    render(
      <CanvasResizeOverlay previewSize={previewSize} canvasRef={paperRef()} />,
    );
    const handle = screen.getByRole("button", { name: "Resize canvas" });

    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(editorStore.getState().canvasResize!.drag).toBeNull();
  });
});
