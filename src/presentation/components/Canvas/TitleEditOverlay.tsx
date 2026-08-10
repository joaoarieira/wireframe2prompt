import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef } from "react";
import { useEditorStore } from "../../state/app-store/appStore";
import type { TitledElement } from "../../../domain/entities/element/TitledElement";

interface TitleEditOverlayProps {
  element: TitledElement;
  onEnd(): void;
  canvasRef: RefObject<HTMLElement | null>;
}

/**
 * Inline textarea overlaid on the title of a card or modal while it is
 * double-click-edited on the canvas. Positioned over the element's
 * {@link TitledElement.titleRegion}, so it is exactly as wide as the room the
 * glyph mapper gives the title — anything the card would truncate scrolls out
 * of the (hidden-overflow) box here too. The title is single-line, so Enter
 * ends the session instead of inserting a break. Mirrors
 * {@link TextEditOverlay}'s focus/blur reclaim so the surrounding pointer
 * gesture doesn't cut editing short.
 */
export function TitleEditOverlay({
  element,
  onEnd,
  canvasRef,
}: TitleEditOverlayProps) {
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
    if (event.key === "Enter" || event.key === "Escape") {
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

  const region = element.titleRegion();
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
    // it in — so the title occupies the same space during and after editing.
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "calc(var(--cell-w) - 1ch)",
    paddingLeft: "calc((var(--cell-w) - 1ch) / 2)",
    whiteSpace: "pre",
  };

  return (
    <textarea
      ref={textareaRef}
      data-testid="title-edit-overlay"
      wrap="off"
      className="bg-base-100 text-base-content"
      style={style}
      value={element.title ?? ""}
      onChange={(event) =>
        editElementProps(element.id, {
          title: event.target.value === "" ? null : event.target.value,
        })
      }
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}
