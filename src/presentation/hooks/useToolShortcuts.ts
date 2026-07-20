import { useEffect } from "react";
import { useEditorStore } from "../state/app-store/appStore";
import { toolForShortcut } from "../state/keyboard/toolShortcut";

/**
 * True when the event target is a text-entry surface (input/textarea/select or
 * a `contentEditable` node), so a single-key tool shortcut must not fire —
 * typing "t" while editing a text element must not switch tools.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Blurs the focused element so a previously-clicked control drops its focus ring. */
function blurActiveElement(): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

/**
 * Wires Figma-style single-key tool shortcuts (V/H/T/R/P/L/Shift+L/I) at the
 * window level while the editor is mounted. Ignored while a text field or the
 * canvas inline editor holds the key, or when another handler already used it.
 */
export function useToolShortcuts(): void {
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const canvasEditingElementId = useEditorStore(
    (state) => state.canvasEditingElementId,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (isEditableTarget(event.target)) return;
      if (canvasEditingElementId !== null) return;
      const toolId = toolForShortcut(event);
      if (toolId === null) return;
      event.preventDefault();
      // Drop DOM focus from the previously-clicked tool button, or its focus
      // ring lingers over the old tool while a new one is active.
      blurActiveElement();
      setActiveTool(toolId);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTool, canvasEditingElementId]);
}
