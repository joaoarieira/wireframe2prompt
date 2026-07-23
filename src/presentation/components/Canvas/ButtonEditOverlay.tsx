import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef } from "react";
import { useEditorStore } from "../../state/app-store/appStore";
import type { ButtonElement } from "../../../domain/entities/element/ButtonElement";

interface ButtonEditOverlayProps {
  element: ButtonElement;
  onEnd(): void;
  canvasRef: RefObject<HTMLElement | null>;
}

/**
 * Inline textarea overlaid on a ButtonElement's centered label while it is
 * edited on the canvas (on placement or double-click). Positioned over the
 * button's {@link ButtonElement.textRegion}; the label is center-aligned so it
 * tracks the centered glyphs the compositor rasterizes, and the button grows to
 * fit as the user types (a longer line widens it, Shift+Enter adds a line and
 * grows it downward). Enter ends the session; Shift+Enter inserts a line break.
 * Mirrors {@link TextEditOverlay}'s focus/blur reclaim so the surrounding
 * pointer gesture doesn't cut editing short.
 */
export function ButtonEditOverlay({
  element,
  onEnd,
  canvasRef,
}: ButtonEditOverlayProps) {
  const editElementProps = useEditorStore((state) => state.editElementProps);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setTimeout(() => {
      if (el === null || !el.isConnected) {
        return;
      }
      const canvas = canvasRef.current?.closest<HTMLElement>(
        '[data-testid="canvas"]',
      );
      if (document.activeElement === canvas) {
        el.focus();
      } else {
        onEnd();
      }
    }, 0);
  };

  const region = element.textRegion();
  const style: CSSProperties = {
    position: "absolute",
    left: `calc(var(--cell-w) * ${region.position.col})`,
    top: `calc(var(--cell-h) * ${region.position.row})`,
    width: `calc(var(--cell-w) * ${region.size.width})`,
    height: `calc(var(--cell-h) * ${region.size.height})`,
    lineHeight: "var(--cell-h)",
    padding: 0,
    resize: "none",
    overflow: "hidden",
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "var(--color-primary)",
    // Cell-exact typography (see TextEditOverlay): the grid draws one mono glyph
    // centered in each --cell-w × --cell-h span, but a textarea lays text out by
    // the font's natural advance (~0.6em < --cell-w). Inheriting the canvas mono
    // font and padding each glyph's advance up to --cell-w via letter-spacing
    // keeps every typed character over the exact cell the compositor rasterizes
    // it in — so the label occupies the same space during and after editing. The
    // overlay is positioned over the centered label block (textRegion), so
    // left-anchoring here already lines up with the centered glyphs.
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "calc(var(--cell-w) - 1ch)",
    paddingLeft: "calc((var(--cell-w) - 1ch) / 2)",
    whiteSpace: "pre",
  };

  return (
    <textarea
      ref={textareaRef}
      data-testid="button-edit-overlay"
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
