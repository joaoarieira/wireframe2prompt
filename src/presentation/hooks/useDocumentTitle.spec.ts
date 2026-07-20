import { afterEach, describe, expect, test } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useDocumentTitle } from "./useDocumentTitle";

afterEach(() => {
  cleanup();
});

describe("useDocumentTitle", () => {
  test("sets the tab title on mount", () => {
    renderHook(() => useDocumentTitle("hello - wireframe2prompt"));
    expect(document.title).toBe("hello - wireframe2prompt");
  });

  test("updates the tab title when it changes", () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: "first" },
    });
    expect(document.title).toBe("first");

    rerender({ title: "second" });
    expect(document.title).toBe("second");
  });
});
