export interface ToolShortcutInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/** Single-key tool activation, Figma-style. `l` doubles as line / Shift+L arrow. */
const TOOL_BY_KEY: Readonly<Record<string, string>> = {
  v: "select",
  h: "hand",
  t: "text",
  r: "box",
  p: "pencil",
  l: "line",
  i: "input",
};

/**
 * Maps a keyboard event to the tool id it activates, or null when the key is
 * not a tool shortcut. Pure so the whole keymap is testable without DOM events.
 *
 * @example
 * toolForShortcut({ key: "t", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
 * // "text"
 */
export function toolForShortcut(input: ToolShortcutInput): string | null {
  if (input.ctrlKey || input.metaKey || input.altKey) {
    return null;
  }
  const key = input.key.toLowerCase();
  if (key === "l") {
    return input.shiftKey ? "arrow" : "line";
  }
  if (input.shiftKey) {
    return null;
  }
  return TOOL_BY_KEY[key] ?? null;
}

/** Shortcut label per tool id (e.g. "T", "Shift+L"); undefined = no shortcut. */
export const SHORTCUT_LABEL_BY_TOOL: Readonly<Record<string, string>> = {
  select: "V",
  hand: "H",
  text: "T",
  box: "R",
  pencil: "P",
  line: "L",
  arrow: "Shift+L",
  input: "I",
};
