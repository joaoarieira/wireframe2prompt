import { describe, expect, test } from "vitest";
import { FixedClock } from "./FixedClock";

describe("FixedClock", () => {
  test("returns the constructed value and defaults to 0", () => {
    expect(new FixedClock().now()).toBe(0);
    expect(new FixedClock(42).now()).toBe(42);
  });

  test("set() moves the fixed time", () => {
    const clock = new FixedClock(1);
    clock.set(99);
    expect(clock.now()).toBe(99);
  });
});
