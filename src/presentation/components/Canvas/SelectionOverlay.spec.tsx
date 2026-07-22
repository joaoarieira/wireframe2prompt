import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SelectionOverlay } from "./SelectionOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { Position } from "../../../domain/entities/position/Position";

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    drag: null,
    inspectorOpen: false,
  });
});

function makeContext(box = makeBox("b1")) {
  editorStore.setState({
    document: makeDoc(box),
    documentStatus: "ready",
    selectedElementIds: [box.id],
  });
  return box;
}

const getCell = () => Position.create(0, 0);

describe("SelectionOverlay", () => {
  test("renders the selection border with the testid", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    expect(screen.getByTestId("selection-overlay")).toBeInTheDocument();
  });

  test("resize handle is present when showResizeHandle is true", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Resize element" }),
    ).toBeInTheDocument();
  });

  test("resize handle shows the themed move-diagonal-2 cursor", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    expect(handle.style.cursor).toContain('url("data:image/svg+xml,');
    expect(handle.style.cursor.endsWith(", se-resize")).toBe(true);
  });

  test("resize handle is absent when showResizeHandle is false", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle={false}
        showEditButton={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Resize element" })).toBeNull();
  });

  test("pointer-down on the handle starts a resize drag", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(editorStore.getState().drag).not.toBeNull();
  });

  test("pointer-down when getCell returns null is a no-op (no drag started)", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={() => null}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(editorStore.getState().drag).toBeNull();
  });

  test("pointer-move without an active drag is a no-op", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();

    // move without prior pointerDown → not resizing → no drag update
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 20, clientY: 20 });

    expect(editorStore.getState().drag).toBeNull();
  });

  test("pointer-move when getCell returns null is a no-op even while resizing", () => {
    const el = makeContext();
    let returnNull = false;
    const getCellMaybe = () => (returnNull ? null : Position.create(0, 0));
    render(
      <SelectionOverlay
        element={el}
        getCell={getCellMaybe}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).not.toBeNull();

    returnNull = true;
    const dragBefore = editorStore.getState().drag;
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 50, clientY: 50 });
    expect(editorStore.getState().drag).toStrictEqual(dragBefore);
  });

  test("pointer-up without an active drag is a no-op", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });

    // up without prior down → resizing.current is false → commitDrag not called
    fireEvent.pointerUp(handle, { pointerId: 1 });

    // drag was never started
    expect(editorStore.getState().drag).toBeNull();
  });

  test("pointer-move during active resize calls updateDrag", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).not.toBeNull();

    // After down, resizing.current = true; move fires updateDrag (line 49)
    fireEvent.pointerMove(handle, { pointerId: 1 });

    expect(editorStore.getState().drag).not.toBeNull();
  });

  test("handle opts out of touch scrolling with touch-none", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    expect(handle.className).toContain("touch-none");
  });

  test("pointer-cancel during an active resize discards the drag", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).not.toBeNull();

    fireEvent.pointerCancel(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).toBeNull();
  });

  test("pointer-cancel without an active resize is a no-op", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });

    // cancel without prior down → resizing.current is false → no cancelDrag
    fireEvent.pointerCancel(handle, { pointerId: 1 });

    expect(editorStore.getState().drag).toBeNull();
  });

  test("edit button is present when showEditButton is true", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton
      />,
    );
    expect(
      screen.getByRole("button", { name: "Edit element" }),
    ).toBeInTheDocument();
  });

  test("edit button is absent when showEditButton is false", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Edit element" })).toBeNull();
  });

  test("clicking the edit button opens the inspector", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton
      />,
    );
    expect(editorStore.getState().inspectorOpen).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Edit element" }));

    expect(editorStore.getState().inspectorOpen).toBe(true);
  });

  test("delete button is present when showEditButton is true", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton
      />,
    );
    expect(
      screen.getByRole("button", { name: "Delete element" }),
    ).toBeInTheDocument();
  });

  test("delete button is absent when showEditButton is false", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Delete element" })).toBeNull();
  });

  test("clicking the delete button removes the selected element", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton
      />,
    );
    expect(editorStore.getState().document?.elements).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Delete element" }));

    expect(editorStore.getState().document?.elements).toHaveLength(0);
  });

  test("full pointer-down → pointer-up sequence commits the drag", () => {
    const el = makeContext();
    render(
      <SelectionOverlay
        element={el}
        getCell={getCell}
        showResizeHandle
        showEditButton={false}
      />,
    );
    const handle = screen.getByRole("button", { name: "Resize element" });
    handle.setPointerCapture = vi.fn();
    fireEvent.pointerDown(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).not.toBeNull();

    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(editorStore.getState().drag).toBeNull();
  });
});
