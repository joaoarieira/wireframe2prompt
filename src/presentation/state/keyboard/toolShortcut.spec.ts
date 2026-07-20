import { describe, expect, test } from "vitest";
import { SHORTCUT_LABEL_BY_TOOL, toolForShortcut } from "./toolShortcut";
import type { ToolShortcutInput } from "./toolShortcut";

function key(overrides: Partial<ToolShortcutInput>): ToolShortcutInput {
  return {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("toolForShortcut", () => {
  test.each([
    ["v", "select"],
    ["h", "hand"],
    ["t", "text"],
    ["r", "box"],
    ["p", "pencil"],
    ["l", "line"],
    ["i", "input"],
  ])("%s → %s", (pressed, toolId) => {
    expect(toolForShortcut(key({ key: pressed }))).toBe(toolId);
  });

  test("shift+l → arrow, plain l → line", () => {
    expect(toolForShortcut(key({ key: "l", shiftKey: true }))).toBe("arrow");
    expect(toolForShortcut(key({ key: "L", shiftKey: true }))).toBe("arrow");
    expect(toolForShortcut(key({ key: "l" }))).toBe("line");
  });

  test("uppercase keys normalize to the same tool", () => {
    expect(toolForShortcut(key({ key: "T" }))).toBe("text");
    expect(toolForShortcut(key({ key: "R" }))).toBe("box");
  });

  test("shift on a non-L letter is not a shortcut", () => {
    expect(toolForShortcut(key({ key: "t", shiftKey: true }))).toBeNull();
    expect(toolForShortcut(key({ key: "v", shiftKey: true }))).toBeNull();
  });

  test("any command/alt modifier blocks the shortcut", () => {
    expect(toolForShortcut(key({ key: "v", ctrlKey: true }))).toBeNull();
    expect(toolForShortcut(key({ key: "v", metaKey: true }))).toBeNull();
    expect(toolForShortcut(key({ key: "v", altKey: true }))).toBeNull();
    expect(
      toolForShortcut(key({ key: "l", ctrlKey: true, shiftKey: true })),
    ).toBeNull();
  });

  test("keys outside the map → null", () => {
    expect(toolForShortcut(key({ key: "z" }))).toBeNull();
    expect(toolForShortcut(key({ key: "Escape" }))).toBeNull();
  });
});

describe("SHORTCUT_LABEL_BY_TOOL", () => {
  test("labels the shortcut-bearing tools", () => {
    expect(SHORTCUT_LABEL_BY_TOOL).toEqual({
      select: "V",
      hand: "H",
      text: "T",
      box: "R",
      pencil: "P",
      line: "L",
      arrow: "Shift+L",
      input: "I",
    });
  });
});
