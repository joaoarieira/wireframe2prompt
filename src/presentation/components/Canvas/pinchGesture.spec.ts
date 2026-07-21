import { describe, expect, test } from "vitest";
import { pinchDelta, type PinchPoint } from "./pinchGesture";

const pair = (a: PinchPoint, b: PinchPoint): [PinchPoint, PinchPoint] => [a, b];

describe("pinchDelta", () => {
  test("guards a zero previous distance with scaleFactor 1", () => {
    const same = { x: 5, y: 5 };
    const result = pinchDelta(
      pair(same, same),
      pair({ x: 0, y: 0 }, { x: 4, y: 0 }),
    );
    expect(result.scaleFactor).toBe(1);
  });

  test("fingers spreading apart scales up", () => {
    const result = pinchDelta(
      pair({ x: 0, y: 0 }, { x: 10, y: 0 }),
      pair({ x: 0, y: 0 }, { x: 20, y: 0 }),
    );
    expect(result.scaleFactor).toBe(2);
  });

  test("fingers pinching together scales down", () => {
    const result = pinchDelta(
      pair({ x: 0, y: 0 }, { x: 20, y: 0 }),
      pair({ x: 0, y: 0 }, { x: 10, y: 0 }),
    );
    expect(result.scaleFactor).toBe(0.5);
  });

  test("midpoint is the average of the current pair", () => {
    const result = pinchDelta(
      pair({ x: 0, y: 0 }, { x: 10, y: 10 }),
      pair({ x: 2, y: 4 }, { x: 6, y: 8 }),
    );
    expect(result.midpoint).toEqual({ x: 4, y: 6 });
  });

  test("midpointDelta is the translation of the midpoint between samples", () => {
    const result = pinchDelta(
      pair({ x: 0, y: 0 }, { x: 10, y: 0 }),
      pair({ x: 5, y: 3 }, { x: 15, y: 3 }),
    );
    // previous midpoint (5,0) → current midpoint (10,3)
    expect(result.midpointDelta).toEqual({ x: 5, y: 3 });
  });
});
