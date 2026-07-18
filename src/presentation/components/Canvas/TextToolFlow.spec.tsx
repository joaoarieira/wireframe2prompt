import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Canvas } from "./Canvas";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";

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
    textEditingElementId: null,
    canvasEditingElementId: null,
    viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  });
});

function setupGrid() {
  editorStore.setState({
    document: makeDoc(makeBox("b1")),
    documentStatus: "ready",
    activeToolId: "text",
  });
  render(<Canvas />);

  const grid = screen.getByTestId("grid-surface");
  vi.spyOn(grid, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 200,
    height: 180,
  } as DOMRect);
  grid.setPointerCapture = vi.fn();
  return grid;
}

describe("text tool placement — full pointer sequence", () => {
  test("overlay present after full pointerDown→pointerUp→click sequence", () => {
    const grid = setupGrid();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    fireEvent.pointerUp(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    fireEvent.click(grid, { button: 0, clientX: 15, clientY: 18 });

    expect(screen.getByTestId("text-edit-overlay")).toBeInTheDocument();
  });

  test("overlay still focused after pointerUp and click", () => {
    const grid = setupGrid();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    fireEvent.pointerUp(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    fireEvent.click(grid, { button: 0, clientX: 15, clientY: 18 });

    expect(screen.getByTestId("text-edit-overlay")).toHaveFocus();
  });

  test("canvasEditingElementId is not cleared by pointerUp or click", () => {
    const grid = setupGrid();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    const idAfterDown = editorStore.getState().canvasEditingElementId;

    fireEvent.pointerUp(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 18,
    });
    fireEvent.click(grid, { button: 0, clientX: 15, clientY: 18 });

    expect(editorStore.getState().canvasEditingElementId).toBe(idAfterDown);
  });
});
