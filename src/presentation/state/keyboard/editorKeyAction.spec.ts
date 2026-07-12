import { describe, expect, test } from "vitest";
import { editorActionForKey } from "./editorKeyAction";
import type { EditorKeyInput } from "./editorKeyAction";

function key(overrides: Partial<EditorKeyInput>): EditorKeyInput {
  return {
    key: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("editorActionForKey", () => {
  test("ctrl+z / cmd+z → undo", () => {
    expect(editorActionForKey(key({ key: "z", ctrlKey: true }))).toEqual({
      type: "undo",
    });
    expect(editorActionForKey(key({ key: "Z", metaKey: true }))).toEqual({
      type: "undo",
    });
  });

  test("ctrl+shift+z and ctrl+y → redo", () => {
    expect(
      editorActionForKey(key({ key: "z", ctrlKey: true, shiftKey: true })),
    ).toEqual({ type: "redo" });
    expect(editorActionForKey(key({ key: "y", ctrlKey: true }))).toEqual({
      type: "redo",
    });
  });

  test("Delete and Backspace → remove-selected", () => {
    expect(editorActionForKey(key({ key: "Delete" }))).toEqual({
      type: "remove-selected",
    });
    expect(editorActionForKey(key({ key: "Backspace" }))).toEqual({
      type: "remove-selected",
    });
  });

  test("arrow keys → 1-cell nudges", () => {
    expect(editorActionForKey(key({ key: "ArrowLeft" }))).toEqual({
      type: "nudge",
      deltaCol: -1,
      deltaRow: 0,
    });
    expect(editorActionForKey(key({ key: "ArrowRight" }))).toEqual({
      type: "nudge",
      deltaCol: 1,
      deltaRow: 0,
    });
    expect(editorActionForKey(key({ key: "ArrowUp" }))).toEqual({
      type: "nudge",
      deltaCol: 0,
      deltaRow: -1,
    });
    expect(editorActionForKey(key({ key: "ArrowDown" }))).toEqual({
      type: "nudge",
      deltaCol: 0,
      deltaRow: 1,
    });
  });

  test("non-shortcut keys → null", () => {
    expect(editorActionForKey(key({ key: "z" }))).toBeNull();
    expect(editorActionForKey(key({ key: "x", ctrlKey: true }))).toBeNull();
    expect(editorActionForKey(key({ key: "Enter" }))).toBeNull();
  });
});
