import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef } from "react";
import { useEditorStore } from "../../state/app-store/appStore";
import type {
  FieldElement,
  FieldName,
} from "../../../domain/entities/element/FieldElement";

interface FieldEditOverlayProps {
  element: FieldElement;
  field: FieldName;
  onEnd(): void;
  canvasRef: RefObject<HTMLElement | null>;
}

/** Current text of the slot being edited (null slots edit as empty). */
function valueOf(element: FieldElement, field: FieldName): string {
  const slot =
    field === "label"
      ? element.label
      : field === "placeholder"
        ? element.placeholder
        : element.hint;
  return slot ?? "";
}

/**
 * Inline textarea overlaid on one text slot of a field element (input/dropdown)
 * while it is double-click-edited on the canvas. Positioned over the slot's grid
 * region; only the hint wraps (matching the glyph mapper). Mirrors
 * {@link TextEditOverlay}'s focus/blur reclaim so the surrounding pointer
 * gesture doesn't cut editing short.
 */
export function FieldEditOverlay({
  element,
  field,
  onEnd,
  canvasRef,
}: FieldEditOverlayProps) {
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
    // Only the hint is multi-line; a bare Enter ends editing elsewhere.
    if (event.key === "Enter" && (field !== "hint" || !event.shiftKey)) {
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

  const region =
    field === "label"
      ? element.labelRegion()
      : field === "placeholder"
        ? element.placeholderRegion()
        : element.hintRegion();

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
    fontFamily: "inherit",
    fontSize: "inherit",
    letterSpacing: "calc(var(--cell-w) - 1ch)",
    paddingLeft: "calc((var(--cell-w) - 1ch) / 2)",
    whiteSpace: field === "hint" ? "pre-wrap" : "pre",
  };

  return (
    <textarea
      ref={textareaRef}
      data-testid="field-edit-overlay"
      data-field={field}
      wrap={field === "hint" ? "soft" : "off"}
      className="bg-base-100 text-base-content"
      style={style}
      value={valueOf(element, field)}
      onChange={(event) =>
        editElementProps(element.id, {
          [field]: event.target.value === "" ? null : event.target.value,
        })
      }
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPointerDown={(event) => event.stopPropagation()}
    />
  );
}
