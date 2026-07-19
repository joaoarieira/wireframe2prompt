import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarqueeOverlay } from "./MarqueeOverlay";
import { Position } from "../../../domain/entities/position/Position";

function makeMarquee(
  startCol: number,
  startRow: number,
  lastCol: number,
  lastRow: number,
) {
  return {
    startCell: Position.create(startCol, startRow),
    lastCell: Position.create(lastCol, lastRow),
  };
}

describe("MarqueeOverlay", () => {
  test("renders with the marquee-overlay test id", () => {
    render(<MarqueeOverlay marquee={makeMarquee(0, 0, 3, 2)} />);
    expect(screen.getByTestId("marquee-overlay")).toBeInTheDocument();
  });

  test("is pointer-transparent", () => {
    render(<MarqueeOverlay marquee={makeMarquee(0, 0, 3, 2)} />);
    expect(screen.getByTestId("marquee-overlay").className).toContain(
      "pointer-events-none",
    );
  });

  test("normalises an inverted drag (last < start)", () => {
    // Dragging top-right to bottom-left: the overlay must cover the same
    // rect as a canonical top-left to bottom-right drag.
    render(<MarqueeOverlay marquee={makeMarquee(5, 4, 2, 1)} />);
    const overlay = screen.getByTestId("marquee-overlay");
    // col normalises to min(5,2)=2, row to min(4,1)=1
    expect(overlay.style.left).toBe("calc(var(--cell-w) * 2)");
    expect(overlay.style.top).toBe("calc(var(--cell-h) * 1)");
    // width = |5-2|+1 = 4, height = |4-1|+1 = 4
    expect(overlay.style.width).toBe("calc(var(--cell-w) * 4)");
    expect(overlay.style.height).toBe("calc(var(--cell-h) * 4)");
  });

  test("canonical drag (start < last) places the rect correctly", () => {
    render(<MarqueeOverlay marquee={makeMarquee(1, 2, 4, 5)} />);
    const overlay = screen.getByTestId("marquee-overlay");
    expect(overlay.style.left).toBe("calc(var(--cell-w) * 1)");
    expect(overlay.style.top).toBe("calc(var(--cell-h) * 2)");
    expect(overlay.style.width).toBe("calc(var(--cell-w) * 4)");
    expect(overlay.style.height).toBe("calc(var(--cell-h) * 4)");
  });

  test("single-cell marquee has width and height of 1", () => {
    render(<MarqueeOverlay marquee={makeMarquee(3, 3, 3, 3)} />);
    const overlay = screen.getByTestId("marquee-overlay");
    expect(overlay.style.width).toBe("calc(var(--cell-w) * 1)");
    expect(overlay.style.height).toBe("calc(var(--cell-h) * 1)");
  });
});
