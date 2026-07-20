import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, renderHook, act, waitFor } from "@testing-library/react";
import { useColorScheme } from "./useColorScheme";
import { resolveScheme } from "../theme/theme";

// The pure scheme resolution is covered by theme.spec.ts; here we only assert
// the hook wiring (initial read + reacting to a data-theme change).
vi.mock("../theme/theme", () => ({
  resolveScheme: vi.fn(() => "light"),
}));

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
});

describe("useColorScheme", () => {
  test("returns the scheme resolveScheme reports", () => {
    vi.mocked(resolveScheme).mockReturnValue("dark");
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe("dark");
  });

  test("re-reads when data-theme changes on <html>", async () => {
    vi.mocked(resolveScheme).mockReturnValue("light");
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe("light");

    vi.mocked(resolveScheme).mockReturnValue("dark");
    act(() => {
      document.documentElement.setAttribute("data-theme", "wireframe-dark");
    });

    await waitFor(() => expect(result.current).toBe("dark"));
  });
});
