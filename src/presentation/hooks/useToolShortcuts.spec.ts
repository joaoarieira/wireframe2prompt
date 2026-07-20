import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { isEditableTarget, useToolShortcuts } from "./useToolShortcuts";
import { editorStore } from "../state/app-store/appStore";

/** Dispatches a keydown at the window with an optional editable-field target. */
function pressKey(init: KeyboardEventInit, target?: HTMLElement): void {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...init });
  if (target !== undefined) {
    Object.defineProperty(event, "target", { value: target });
  }
  act(() => {
    window.dispatchEvent(event);
  });
}

beforeEach(() => {
  act(() => {
    editorStore.getState().setActiveTool("select");
    editorStore.setState({ canvasEditingElementId: null });
  });
});

afterEach(() => {
  cleanup();
});

describe("useToolShortcuts", () => {
  test.each([
    [{ key: "v" }, "select"],
    [{ key: "h" }, "hand"],
    [{ key: "t" }, "text"],
    [{ key: "r" }, "box"],
    [{ key: "p" }, "pencil"],
    [{ key: "l" }, "line"],
    [{ key: "i" }, "input"],
    [{ key: "l", shiftKey: true }, "arrow"],
  ])("%o activates %s", (init, toolId) => {
    renderHook(() => useToolShortcuts());
    pressKey(init);
    expect(editorStore.getState().activeToolId).toBe(toolId);
  });

  test("keydown from an input field does not switch tools", () => {
    renderHook(() => useToolShortcuts());
    pressKey({ key: "t" }, document.createElement("input"));
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("keydown from a textarea does not switch tools", () => {
    renderHook(() => useToolShortcuts());
    pressKey({ key: "t" }, document.createElement("textarea"));
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("active canvas inline editing suppresses the shortcut", () => {
    act(() => {
      editorStore.setState({ canvasEditingElementId: "t1" });
    });
    renderHook(() => useToolShortcuts());
    pressKey({ key: "t" });
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("Ctrl+V stays paste — no tool switch", () => {
    renderHook(() => useToolShortcuts());
    pressKey({ key: "v", ctrlKey: true });
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("an already-handled event is ignored", () => {
    renderHook(() => useToolShortcuts());
    const event = new KeyboardEvent("keydown", { key: "t", cancelable: true });
    event.preventDefault();
    act(() => {
      window.dispatchEvent(event);
    });
    expect(editorStore.getState().activeToolId).toBe("select");
  });

  test("activating a tool blurs the previously-focused button", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    renderHook(() => useToolShortcuts());
    // The focused button is the keydown target — a button is not editable, so
    // the shortcut fires and must drop its focus ring.
    pressKey({ key: "r" }, button);

    expect(editorStore.getState().activeToolId).toBe("box");
    expect(document.activeElement).not.toBe(button);
    button.remove();
  });

  test("a null activeElement is left alone", () => {
    vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
    renderHook(() => useToolShortcuts());

    expect(() => pressKey({ key: "r" })).not.toThrow();
    expect(editorStore.getState().activeToolId).toBe("box");
    vi.restoreAllMocks();
  });

  test("unmount removes the listener", () => {
    const { unmount } = renderHook(() => useToolShortcuts());
    unmount();
    pressKey({ key: "t" });
    expect(editorStore.getState().activeToolId).toBe("select");
  });
});

describe("isEditableTarget", () => {
  test("true for input, textarea, select and contentEditable", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    // jsdom does not compute isContentEditable; force the read.
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isEditableTarget(editable)).toBe(true);
  });

  test("false for a plain element and for null", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
