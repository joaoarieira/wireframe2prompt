import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useTheme } from "./useTheme";
import { choosePreference, resolvePreference } from "../theme/theme";

// The pure helpers are covered by theme.spec.ts; here we only assert the hook
// wiring, so the module is mocked.
vi.mock("../theme/theme", () => ({
  resolvePreference: vi.fn(() => "system"),
  choosePreference: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(resolvePreference).mockReturnValue("system");
  vi.mocked(choosePreference).mockClear();
});

afterEach(() => {
  cleanup();
});

describe("useTheme", () => {
  test("initial preference mirrors resolvePreference", () => {
    vi.mocked(resolvePreference).mockReturnValue("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("dark");
  });

  test("setPreference persists the choice and re-renders with it", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setPreference("light"));

    expect(result.current.preference).toBe("light");
    expect(choosePreference).toHaveBeenCalledWith("light");
  });
});
