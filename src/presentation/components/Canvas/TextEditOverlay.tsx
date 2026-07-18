import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef } from "react";
import { useEditorStore } from "../../state/app-store/appStore";
import type { TextElement } from "../../../domain/entities/element/TextElement";

interface TextEditOverlayProps {
  element: TextElement;
  onEnd(): void;
  canvasRef: RefObject<HTMLElement | null>;
}

/**
 * Inline textarea overlaid on the canvas while a TextElement is being edited.
 * Positioned by the same cell-size CSS vars as SelectionOverlay.
 */
export function TextEditOverlay({
  element,
  onEnd,
  canvasRef,
}: TextEditOverlayProps) {
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useEffect is more reliable than autoFocus for programmatic focus,
  // especially when the element is mounted during a pointer event sequence.
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const focusCanvas = () => {
    canvasRef.current?.closest<HTMLElement>('[data-testid="canvas"]')?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onEnd();
      focusCanvas();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onEnd();
      focusCanvas();
    }
  };

  const handleBlur = () => {
    const el = textareaRef.current;
    // Defer the decision so the browser finishes moving focus before we check.
    // When the user places a text element, mousedown fires after pointerdown and
    // moves focus to the canvas div (nearest focusable ancestor of the grid).
    // If we end editing immediately on blur, the overlay disappears before the
    // user can type. Deferring lets us detect that case and re-claim focus.
    setTimeout(() => {
      if (el === null || !el.isConnected) {
        // Overlay was already unmounted by a store action (e.g. selectElement
        // picking a different element) — nothing to do.
        return;
      }
      const canvas = canvasRef.current?.closest<HTMLElement>(
        '[data-testid="canvas"]',
      );
      if (document.activeElement === canvas) {
        // The canvas div stole focus via mousedown on the grid (not a user
        // intent to stop editing) — reclaim focus on the textarea.
        el.focus();
      } else {
        // Focus genuinely moved elsewhere (inspector, backdrop click, etc.)
        onEnd();
      }
    }, 0);
  };

  const style: CSSProperties = {
    position: "absolute",
    left: `calc(var(--cell-w) * ${element.position.col})`,
    top: `calc(var(--cell-h) * ${element.position.row})`,
    width: `calc(var(--cell-w) * ${element.size.width})`,
    height: `calc(var(--cell-h) * ${element.size.height})`,
    lineHeight: "var(--cell-h)",
    padding: 0,
    resize: "none",
    overflow: "hidden",
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "var(--color-primary)",
    // Cell-exact typography: the grid draws one mono glyph centered in each
    // --cell-w × --cell-h span, but a textarea lays text out by the font's
    // natural advance (~0.6em < --cell-w). Inheriting the canvas mono font and
    // padding each glyph's advance up to --cell-w via letter-spacing keeps
    // every typed character over the cell the compositor will rasterize it in.
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "calc(var(--cell-w) - 1ch)",
    // The grid centers glyphs in their span; letter-spacing trails the glyph,
    // so half a gap of left padding re-centers each character in its cell.
    paddingLeft: "calc((var(--cell-w) - 1ch) / 2)",
    whiteSpace: "pre",
  };

  return (
    <textarea
      ref={textareaRef}
      data-testid="text-edit-overlay"
      wrap="off"
      className="bg-base-100 text-base-content"
      style={style}
      value={element.text}
      onChange={(event) =>
        editElementProps(element.id, { text: event.target.value })
      }
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}
