export interface EditorKeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export type EditorKeyAction =
  | { type: "undo" }
  | { type: "redo" }
  | { type: "remove-selected" }
  | { type: "nudge"; deltaCol: number; deltaRow: number };

const nudgeByKey: Record<string, { deltaCol: number; deltaRow: number }> = {
  ArrowLeft: { deltaCol: -1, deltaRow: 0 },
  ArrowRight: { deltaCol: 1, deltaRow: 0 },
  ArrowUp: { deltaCol: 0, deltaRow: -1 },
  ArrowDown: { deltaCol: 0, deltaRow: 1 },
};

/**
 * Maps a keyboard event to an editor action, or null when the key is not an
 * editor shortcut. Pure so the whole keymap is testable without DOM events.
 *
 * @example
 * const action = editorActionForKey({ key: "z", ctrlKey: true, metaKey: false, shiftKey: false });
 * // { type: "undo" }
 */
export function editorActionForKey(
  input: EditorKeyInput,
): EditorKeyAction | null {
  const command = input.ctrlKey || input.metaKey;
  if (command && input.key.toLowerCase() === "z") {
    return input.shiftKey ? { type: "redo" } : { type: "undo" };
  }
  if (command && input.key.toLowerCase() === "y") {
    return { type: "redo" };
  }
  if (input.key === "Delete" || input.key === "Backspace") {
    return { type: "remove-selected" };
  }
  const nudge = nudgeByKey[input.key];
  if (nudge !== undefined) {
    return { type: "nudge", ...nudge };
  }
  return null;
}
