import { describe, expect, test } from "vitest";
import {
  beginPress,
  movePress,
  pressElapsed,
  LONG_PRESS_MS,
} from "./touchGestures";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(2, 3);

describe("touchGestures long-press", () => {
  test("fires once the press has rested long enough", () => {
    const press = beginPress(cell, { x: 0, y: 0 }, 1000);
    expect(pressElapsed(press, 1000 + LONG_PRESS_MS)).toBe(true);
  });

  test("does not fire before the threshold", () => {
    const press = beginPress(cell, { x: 0, y: 0 }, 1000);
    expect(pressElapsed(press, 1000 + LONG_PRESS_MS - 1)).toBe(false);
  });

  test("a small drift within tolerance keeps the press alive", () => {
    const press = movePress(beginPress(cell, { x: 0, y: 0 }, 0), {
      x: 5,
      y: 5,
    });
    expect(press.cancelled).toBe(false);
    expect(pressElapsed(press, LONG_PRESS_MS)).toBe(true);
  });

  test("drifting past the tolerance cancels the press", () => {
    const press = movePress(beginPress(cell, { x: 0, y: 0 }, 0), {
      x: 20,
      y: 0,
    });
    expect(press.cancelled).toBe(true);
    expect(pressElapsed(press, LONG_PRESS_MS)).toBe(false);
  });

  test("a cancelled press stays cancelled even if the finger returns", () => {
    const drifted = movePress(beginPress(cell, { x: 0, y: 0 }, 0), {
      x: 20,
      y: 0,
    });
    const returned = movePress(drifted, { x: 0, y: 0 });
    expect(returned.cancelled).toBe(true);
    expect(returned).toBe(drifted); // no new object once cancelled
  });
});
