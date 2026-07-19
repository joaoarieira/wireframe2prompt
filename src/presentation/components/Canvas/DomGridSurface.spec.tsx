import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DomGridSurface } from "./DomGridSurface";
import { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";

// 4 cols × 3 rows rendered at 40×54px → cells of 10×18px
function renderSurface() {
  const buffer = CharBuffer.create(GridSize.create(4, 3));
  const onDown = vi.fn();
  const onMove = vi.fn();
  const onUp = vi.fn();
  const onDoubleClick = vi.fn();
  render(
    <DomGridSurface
      buffer={buffer}
      onCellPointerDown={onDown}
      onCellPointerMove={onMove}
      onCellPointerUp={onUp}
      onCellDoubleClick={onDoubleClick}
    />,
  );
  const grid = screen.getByTestId("grid-surface");
  vi.spyOn(grid, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 40,
    height: 54,
  } as DOMRect);
  grid.setPointerCapture = vi.fn();
  return { grid, onDown, onMove, onUp, onDoubleClick };
}

describe("DomGridSurface", () => {
  test("renders one span per cell with col/row metadata", () => {
    const { grid } = renderSurface();

    expect(grid.querySelectorAll("span")).toHaveLength(12);
    expect(grid.querySelector('[data-col="3"][data-row="2"]')).not.toBeNull();
  });

  test("maps a primary-button drag to cell events with button and shiftKey", () => {
    const { grid, onDown, onMove, onUp } = renderSurface();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      shiftKey: false,
      clientX: 15,
      clientY: 20,
    });
    fireEvent.pointerMove(grid, {
      pointerId: 1,
      button: -1,
      shiftKey: false,
      clientX: 35,
      clientY: 50,
    });
    fireEvent.pointerUp(grid, {
      pointerId: 1,
      button: 0,
      shiftKey: false,
      clientX: 35,
      clientY: 50,
    });

    expect(onDown).toHaveBeenCalledWith(Position.create(1, 1), {
      clientX: 15,
      clientY: 20,
      button: 0,
      shiftKey: false,
    });
    expect(onMove).toHaveBeenCalledWith(Position.create(3, 2), {
      clientX: 35,
      clientY: 50,
      button: -1,
      shiftKey: false,
    });
    expect(onUp).toHaveBeenCalledWith(Position.create(3, 2), {
      clientX: 35,
      clientY: 50,
      button: 0,
      shiftKey: false,
    });
  });

  test("right-click (button 2) fires onCellPointerDown with button 2", () => {
    const { grid, onDown } = renderSurface();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 2,
      shiftKey: false,
      clientX: 15,
      clientY: 20,
    });

    expect(onDown).toHaveBeenCalledWith(
      Position.create(1, 1),
      expect.objectContaining({ button: 2 }),
    );
  });

  test("ignores middle button (1) so the Canvas pan handler can own it", () => {
    const { grid, onDown } = renderSurface();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 1,
      clientX: 15,
      clientY: 20,
    });

    expect(onDown).not.toHaveBeenCalled();
  });

  test("shift+click passes shiftKey true in the SurfacePoint", () => {
    const { grid, onDown } = renderSurface();

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      shiftKey: true,
      clientX: 15,
      clientY: 20,
    });

    expect(onDown).toHaveBeenCalledWith(
      Position.create(1, 1),
      expect.objectContaining({ shiftKey: true }),
    );
  });

  test("contextmenu is prevented so the browser menu does not open on right-click", () => {
    const { grid } = renderSurface();
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    grid.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("ignores pointer down outside the grid and moves without a drag", () => {
    const { grid, onDown, onMove } = renderSurface();

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 100, clientY: 20 });
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 15, clientY: 20 });

    expect(onDown).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
  });

  test("ignores a pointer up that has no active drag", () => {
    const { grid, onUp } = renderSurface();

    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 15, clientY: 20 });

    expect(onUp).not.toHaveBeenCalled();
  });

  test("double click within the grid fires onCellDoubleClick with the right cell", () => {
    const { grid, onDoubleClick } = renderSurface();

    fireEvent.dblClick(grid, { clientX: 15, clientY: 20 });

    expect(onDoubleClick).toHaveBeenCalledWith(Position.create(1, 1));
  });

  test("double click outside the grid is ignored", () => {
    const { grid, onDoubleClick } = renderSurface();

    fireEvent.dblClick(grid, { clientX: 100, clientY: 20 });

    expect(onDoubleClick).not.toHaveBeenCalled();
  });
});
