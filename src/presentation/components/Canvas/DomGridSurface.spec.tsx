import { afterEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { DomGridSurface } from "./DomGridSurface";
import { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";

// 4 cols × 3 rows rendered at 40×54px → cells of 10×18px
function renderSurface(
  showHoverHighlight?: boolean,
  suppressCellEvents?: boolean,
) {
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
      showHoverHighlight={showHoverHighlight}
      suppressCellEvents={suppressCellEvents}
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

  test("right-click pointerdown does not bubble to document, so the context menu it opens is not dismissed by its own opening click", () => {
    const { grid, onDown } = renderSurface();
    const documentPointerDown = vi.fn();
    document.addEventListener("pointerdown", documentPointerDown);

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 2,
      clientX: 15,
      clientY: 20,
    });
    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 20,
    });

    document.removeEventListener("pointerdown", documentPointerDown);
    expect(onDown).toHaveBeenCalledTimes(2);
    // Only the primary press reached document; the secondary one was stopped.
    expect(documentPointerDown).toHaveBeenCalledTimes(1);
    expect(documentPointerDown.mock.calls[0][0].button).toBe(0);
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
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });
    grid.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("ignores pointer down outside the grid; hover move inside grid IS forwarded", () => {
    // Pointer down outside the grid is ignored.
    // Hover moves (without a prior drag) ARE forwarded so the paste-preview
    // ghost can track the cursor; tool move handlers guard internally.
    const { grid, onDown, onMove } = renderSurface();

    fireEvent.pointerDown(grid, { pointerId: 1, clientX: 100, clientY: 20 });
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 15, clientY: 20 });

    expect(onDown).not.toHaveBeenCalled();
    expect(onMove).toHaveBeenCalledWith(
      Position.create(1, 1),
      expect.objectContaining({ clientX: 15, clientY: 20 }),
    );
  });

  test("pointer move with a degenerate (zero-size) rect is ignored", () => {
    // When getBoundingClientRect reports a zero-size rect (e.g. unmounted or
    // hidden element), cellAtPoint returns null → move is dropped.
    const { grid, onMove } = renderSurface();
    vi.spyOn(grid, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    } as DOMRect);

    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 15, clientY: 20 });

    expect(onMove).not.toHaveBeenCalled();
  });

  test("ignores a pointer up that has no active drag", () => {
    const { grid, onUp } = renderSurface();

    fireEvent.pointerUp(grid, { pointerId: 1, clientX: 15, clientY: 20 });

    expect(onUp).not.toHaveBeenCalled();
  });

  test("suppressCellEvents drops pointer down/move/up so a pinch does not drive the tool", () => {
    const { grid, onDown, onMove, onUp } = renderSurface(true, true);

    fireEvent.pointerDown(grid, {
      pointerId: 1,
      button: 0,
      clientX: 15,
      clientY: 20,
    });
    fireEvent.pointerMove(grid, { pointerId: 1, clientX: 25, clientY: 20 });
    fireEvent.pointerUp(grid, {
      pointerId: 1,
      button: 0,
      clientX: 25,
      clientY: 20,
    });

    expect(onDown).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
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

  test("cells carry a native :hover outline by default", () => {
    const { grid } = renderSurface();

    // A CSS :hover outline needs no JS; assert the class contract instead.
    const cell = grid.querySelector('[data-col="1"][data-row="1"]');
    expect(cell?.className).toContain("hover:outline");
    expect(cell?.className).toContain("hover:outline-base-content/50");
  });

  test("showHoverHighlight=false drops the hover outline class", () => {
    // Placement tools pass this off: they show a full element ghost instead.
    const { grid } = renderSurface(false);

    const cell = grid.querySelector('[data-col="1"][data-row="1"]');
    expect(cell?.className).not.toContain("hover:outline");
  });

  test("hover outline is gated behind a real hover pointer (not touch)", () => {
    const { grid } = renderSurface();
    const cell = grid.querySelector('[data-col="1"][data-row="1"]');
    expect(cell?.className).toContain("[@media(hover:hover)]:hover:outline");
  });

  describe("touch gestures", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const touchDown = (grid: HTMLElement, clientX: number, clientY: number) =>
      fireEvent.pointerDown(grid, {
        pointerId: 1,
        button: 0,
        pointerType: "touch",
        clientX,
        clientY,
      });
    const touchUp = (grid: HTMLElement, clientX: number, clientY: number) =>
      fireEvent.pointerUp(grid, {
        pointerId: 1,
        button: 0,
        pointerType: "touch",
        clientX,
        clientY,
      });

    test("a resting long-press opens the context menu via the button-2 path", () => {
      vi.useFakeTimers();
      const { grid, onDown } = renderSurface();
      touchDown(grid, 15, 20);
      // A tiny jitter within tolerance must not cancel the press.
      fireEvent.pointerMove(grid, {
        pointerId: 1,
        pointerType: "touch",
        clientX: 16,
        clientY: 20,
      });
      act(() => vi.advanceTimersByTime(500));
      expect(onDown).toHaveBeenCalledTimes(2);
      expect(onDown.mock.calls[1][1].button).toBe(2);
    });

    test("dragging the finger away cancels the long-press", () => {
      vi.useFakeTimers();
      const { grid, onDown } = renderSurface();
      touchDown(grid, 15, 20);
      fireEvent.pointerMove(grid, {
        pointerId: 1,
        pointerType: "touch",
        clientX: 35,
        clientY: 50,
      });
      act(() => vi.advanceTimersByTime(500));
      expect(onDown).toHaveBeenCalledTimes(1);
    });

    test("lifting before the delay cancels the long-press", () => {
      vi.useFakeTimers();
      const { grid, onDown } = renderSurface();
      touchDown(grid, 15, 20);
      touchUp(grid, 15, 20);
      act(() => vi.advanceTimersByTime(500));
      expect(onDown).toHaveBeenCalledTimes(1);
    });

    test("the up that ends a fired long-press is swallowed (no tool commit)", () => {
      vi.useFakeTimers();
      const { grid, onUp } = renderSurface();
      touchDown(grid, 15, 20);
      act(() => vi.advanceTimersByTime(500));
      touchUp(grid, 15, 20);
      expect(onUp).not.toHaveBeenCalled();
    });

    test("two quick taps on the same cell synthesize a double-tap", () => {
      vi.useFakeTimers();
      const { grid, onDoubleClick } = renderSurface();
      touchDown(grid, 15, 20);
      touchUp(grid, 15, 20);
      touchDown(grid, 15, 20);
      touchUp(grid, 15, 20);
      expect(onDoubleClick).toHaveBeenCalledWith(Position.create(1, 1));
    });

    test("taps spaced beyond the window are not a double-tap", () => {
      vi.useFakeTimers();
      const { grid, onDoubleClick } = renderSurface();
      touchDown(grid, 15, 20);
      touchUp(grid, 15, 20);
      act(() => vi.advanceTimersByTime(400));
      touchDown(grid, 15, 20);
      touchUp(grid, 15, 20);
      expect(onDoubleClick).not.toHaveBeenCalled();
    });
  });
});
