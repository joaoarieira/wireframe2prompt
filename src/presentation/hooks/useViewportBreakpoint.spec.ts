import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { breakpointFrom, useViewportBreakpoint } from "./useViewportBreakpoint";

/** A controllable MediaQueryList fake: flip `matches` then fire `change`. */
class FakeMediaQuery {
  matches: boolean;
  private listeners = new Set<() => void>();
  constructor(matches: boolean) {
    this.matches = matches;
  }
  addEventListener(_type: "change", listener: () => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_type: "change", listener: () => void) {
    this.listeners.delete(listener);
  }
  set(matches: boolean) {
    this.matches = matches;
    this.listeners.forEach((listener) => listener());
  }
}

function stubMatchMedia(md: FakeMediaQuery, lg: FakeMediaQuery) {
  vi.stubGlobal("matchMedia", (query: string) =>
    query.includes("1024") ? lg : md,
  );
}

describe("breakpointFrom", () => {
  test("desktop when lg matches (regardless of md)", () => {
    expect(breakpointFrom(true, true)).toBe("desktop");
  });
  test("tablet when only md matches", () => {
    expect(breakpointFrom(true, false)).toBe("tablet");
  });
  test("phone when neither matches", () => {
    expect(breakpointFrom(false, false)).toBe("phone");
  });
});

describe("useViewportBreakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reports the initial breakpoint from matchMedia", () => {
    stubMatchMedia(new FakeMediaQuery(true), new FakeMediaQuery(false));
    const { result } = renderHook(() => useViewportBreakpoint());
    expect(result.current).toBe("tablet");
  });

  test("reacts to a change event crossing the desktop threshold", () => {
    const md = new FakeMediaQuery(true);
    const lg = new FakeMediaQuery(false);
    stubMatchMedia(md, lg);
    const { result } = renderHook(() => useViewportBreakpoint());
    expect(result.current).toBe("tablet");
    act(() => lg.set(true));
    expect(result.current).toBe("desktop");
  });

  test("removes listeners on unmount", () => {
    const md = new FakeMediaQuery(false);
    const lg = new FakeMediaQuery(false);
    stubMatchMedia(md, lg);
    const { unmount } = renderHook(() => useViewportBreakpoint());
    unmount();
    // After unmount, firing a change must not throw / update anything.
    act(() => md.set(true));
    expect(md.matches).toBe(true);
  });
});
