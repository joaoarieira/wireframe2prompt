import { describe, expect, test } from "vitest";
import { renderHook } from "@testing-library/react";
import { editorStore, useEditorStore } from "./appStore";

describe("appStore", () => {
  test("exposes the app-wide store starting idle", () => {
    expect(editorStore.getState().documentStatus).toBe("idle");
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("default id generator produces UUIDs (via createDocument)", async () => {
    const id = await editorStore.getState().createDocument("smoke");

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    await editorStore.getState().deleteDocument(id);
  });

  test("useEditorStore selects state from the app-wide store", () => {
    const { result } = renderHook(() =>
      useEditorStore((state) => state.activeToolId),
    );

    expect(result.current).toBe("select");
  });
});
