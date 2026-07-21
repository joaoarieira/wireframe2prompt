import { describe, expect, test, vi } from "vitest";
import { useRef } from "react";
import type { RefObject } from "react";
import { render, screen, act } from "@testing-library/react";
import { usePinchZoomPan } from "./usePinchZoomPan";

interface HarnessProps {
  getZoom(): number;
  zoomAtPoint: (zoom: number, x: number, y: number) => void;
  panViewportBy: (dx: number, dy: number) => void;
  cancelGestures: () => void;
  /** When true, keep the anchor rect ref null to exercise the guard. */
  noAnchor?: boolean;
}

function Harness(props: HarnessProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const nullAnchor = useRef<HTMLDivElement | null>(null);
  const { isPinching } = usePinchZoomPan({
    outerRef,
    anchorRectRef: props.noAnchor
      ? (nullAnchor as RefObject<HTMLElement | null>)
      : (anchorRef as RefObject<HTMLElement | null>),
    getZoom: props.getZoom,
    zoomAtPoint: props.zoomAtPoint,
    panViewportBy: props.panViewportBy,
    cancelGestures: props.cancelGestures,
  });
  return (
    <div ref={outerRef} data-testid="outer">
      <div ref={anchorRef}>{isPinching ? "pinching" : "idle"}</div>
    </div>
  );
}

interface PointerInit {
  pointerId: number;
  pointerType?: string;
  clientX?: number;
  clientY?: number;
}

function firePointer(
  el: Element,
  type: string,
  { pointerId, pointerType = "touch", clientX = 0, clientY = 0 }: PointerInit,
) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { pointerId, pointerType, clientX, clientY });
  act(() => {
    el.dispatchEvent(event);
  });
}

function setup(overrides: Partial<HarnessProps> = {}) {
  const props: HarnessProps = {
    getZoom: () => 1,
    zoomAtPoint: vi.fn(),
    panViewportBy: vi.fn(),
    cancelGestures: vi.fn(),
    ...overrides,
  };
  render(<Harness {...props} />);
  return { props, outer: screen.getByTestId("outer") };
}

describe("usePinchZoomPan", () => {
  test("two touch pointers begin a pinch and cancel tool gestures", () => {
    const { props, outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
    expect(screen.getByText("idle")).toBeInTheDocument();
    firePointer(outer, "pointerdown", {
      pointerId: 2,
      clientX: 20,
      clientY: 0,
    });
    expect(screen.getByText("pinching")).toBeInTheDocument();
    expect(props.cancelGestures).toHaveBeenCalledOnce();
  });

  test("moving a finger zooms anchored on the midpoint and pans", () => {
    const { props, outer } = setup({ getZoom: () => 2 });
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
    firePointer(outer, "pointerdown", {
      pointerId: 2,
      clientX: 10,
      clientY: 0,
    });
    firePointer(outer, "pointermove", {
      pointerId: 2,
      clientX: 30,
      clientY: 0,
    });
    // distance 10 → 30 = scaleFactor 3, zoom 2 → 6; anchor = midpoint(15)/zoom(2)
    expect(props.zoomAtPoint).toHaveBeenCalledWith(6, 7.5, 0);
    // midpoint 5 → 15 = pan +10 on x
    expect(props.panViewportBy).toHaveBeenCalledWith(10, 0);
  });

  test("a third finger does not restart the pinch", () => {
    const { props, outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointerdown", { pointerId: 3, clientX: 40 });
    expect(props.cancelGestures).toHaveBeenCalledOnce();
  });

  test("lifting to one finger ends the pinch", () => {
    const { outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointerup", { pointerId: 2, clientX: 20 });
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  test("pointercancel ends the pinch too", () => {
    const { outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointercancel", { pointerId: 1, clientX: 0 });
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  test("ignores non-touch pointers", () => {
    const { props, outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, pointerType: "mouse" });
    firePointer(outer, "pointerdown", { pointerId: 2, pointerType: "mouse" });
    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(props.cancelGestures).not.toHaveBeenCalled();
  });

  test("ignores a move for an untracked pointer", () => {
    const { props, outer } = setup();
    firePointer(outer, "pointermove", { pointerId: 9, clientX: 5 });
    expect(props.zoomAtPoint).not.toHaveBeenCalled();
  });

  test("ignores an up for an untracked pointer", () => {
    const { outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointerup", { pointerId: 9 });
    expect(screen.getByText("pinching")).toBeInTheDocument();
  });

  test("a single-finger move does not zoom (no pair yet)", () => {
    const { props, outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointermove", { pointerId: 1, clientX: 5 });
    expect(props.zoomAtPoint).not.toHaveBeenCalled();
  });

  test("lifting one of three fingers keeps the pinch alive", () => {
    const { outer } = setup();
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointerdown", { pointerId: 3, clientX: 40 });
    firePointer(outer, "pointerup", { pointerId: 3, clientX: 40 });
    expect(screen.getByText("pinching")).toBeInTheDocument();
  });

  test("skips zoom when the anchor rect is unavailable", () => {
    const { props, outer } = setup({ noAnchor: true });
    firePointer(outer, "pointerdown", { pointerId: 1, clientX: 0 });
    firePointer(outer, "pointerdown", { pointerId: 2, clientX: 20 });
    firePointer(outer, "pointermove", { pointerId: 2, clientX: 40 });
    expect(props.zoomAtPoint).not.toHaveBeenCalled();
  });
});
