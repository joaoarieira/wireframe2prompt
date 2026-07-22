import { describe, expect, test, vi } from "vitest";
import { SystemClock } from "./SystemClock";

describe("SystemClock", () => {
  test("now() returns the platform epoch milliseconds", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    expect(new SystemClock().now()).toBe(1_700_000_000_000);
    vi.restoreAllMocks();
  });
});
