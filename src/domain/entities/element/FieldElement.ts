import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

/** The three editable text slots every field element exposes. */
export type FieldName = "label" | "placeholder" | "hint";

export interface FieldElementProps extends ElementBaseProps {
  label: string | null;
  placeholder: string | null;
  hint: string | null;
}

/** A grid rectangle: where a sub-region of the element sits on the canvas. */
export interface FieldRegion {
  position: Position;
  size: Size;
}

/**
 * Hard-wraps text into fixed-width lines, keeping explicit `\n` breaks. Wrapping
 * is by character count (not word), matching the ASCII grid where every glyph is
 * one cell. Always returns at least one line (an empty string for empty text).
 *
 * @example
 * wrapText("abcdef", 4); // => ["abcd", "ef"]
 */
export function wrapText(text: string, width: number): string[] {
  const safeWidth = Math.max(1, width);
  const lines: string[] = [];
  for (const segment of text.split("\n")) {
    if (segment.length === 0) {
      lines.push("");
      continue;
    }
    const chars = [...segment];
    for (let i = 0; i < chars.length; i += safeWidth) {
      lines.push(chars.slice(i, i + safeWidth).join(""));
    }
  }
  return lines;
}

/**
 * Shared base for form-field elements (input, dropdown). Layout is a 3-row
 * bordered box — a label anchored on the top border, a right-anchored
 * placeholder inside — followed by a left-anchored, word-wrapped hint below.
 *
 * The box is always 3 rows; height auto-fits so the bounding box also covers the
 * wrapped hint (hit-testing and the selection overlay stay aligned with what the
 * glyph mapper draws). Width is user-controlled via resize; a resize keeps the
 * requested width but re-derives the height from the hint.
 *
 * Subclasses differ only by kind and whether a dropdown arrow is drawn.
 */
export abstract class FieldElement extends Element {
  public readonly label: string | null;
  public readonly placeholder: string | null;
  public readonly hint: string | null;

  protected constructor(
    base: ElementBaseProps,
    label: string | null,
    placeholder: string | null,
    hint: string | null,
  ) {
    super(base);
    this.label = label;
    this.placeholder = placeholder;
    this.hint = hint;
  }

  /** True when the field row reserves room for a `▼` dropdown indicator. */
  abstract get showsArrow(): boolean;

  /** Builds a new instance of the concrete subclass (no size re-derivation). */
  protected abstract rebuild(
    base: ElementBaseProps,
    label: string | null,
    placeholder: string | null,
    hint: string | null,
  ): FieldElement;

  /** Width (cols) reserved by the arrow plus its gap; 0 when no arrow. */
  private get indicatorWidth(): number {
    return this.showsArrow ? 2 : 0;
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): FieldElement {
    return this.rebuild(
      { ...this.baseProps(), ...overrides },
      this.label,
      this.placeholder,
      this.hint,
    );
  }

  /** Resize keeps the requested width but re-fits the height to the hint. */
  resize(size: Size): FieldElement {
    return this.cloneWith({
      size: FieldElement.fitSize(size.width, this.hint),
    });
  }

  /** Returns a copy with one text slot replaced, re-fitting the height. */
  withField(field: FieldName, value: string | null): FieldElement {
    const label = field === "label" ? value : this.label;
    const placeholder = field === "placeholder" ? value : this.placeholder;
    const hint = field === "hint" ? value : this.hint;
    return this.rebuild(
      {
        ...this.baseProps(),
        size: FieldElement.fitSize(this.size.width, hint),
      },
      label,
      placeholder,
      hint,
    );
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): FieldElement {
    const resolve = (
      field: FieldName,
      current: string | null,
    ): string | null => {
      const value = patch[field];
      return typeof value === "string" || value === null
        ? (value as string | null)
        : current;
    };
    const hint = resolve("hint", this.hint);
    return this.rebuild(
      {
        ...this.baseProps(),
        size: FieldElement.fitSize(this.size.width, hint),
      },
      resolve("label", this.label),
      resolve("placeholder", this.placeholder),
      hint,
    );
  }

  /** Box width (3 borders) plus one row per wrapped hint line. */
  static fitSize(width: number, hint: string | null): Size {
    const safeWidth = Math.max(1, width);
    const lines = wrapText(hint ?? "", safeWidth - 2).length;
    return Size.create(safeWidth, 3 + lines);
  }

  /** The hint text as it wraps across the current width. */
  hintLines(): string[] {
    return wrapText(this.hint ?? "", this.size.width - 2);
  }

  /** Editable region of the label (top border), left-anchored. */
  labelRegion(): FieldRegion {
    const { col, row } = this.position;
    return {
      position: Position.create(col + 2, row),
      size: Size.create(Math.max(1, this.size.width - 4), 1),
    };
  }

  /** Editable region of the placeholder (field row), right-anchored on render. */
  placeholderRegion(): FieldRegion {
    const { col, row } = this.position;
    const width = Math.max(1, this.size.width - 4 - this.indicatorWidth);
    return {
      position: Position.create(col + 2, row + 1),
      size: Size.create(width, 1),
    };
  }

  /** Editable region of the hint (rows below the box), left-anchored. */
  hintRegion(): FieldRegion {
    const { col, row } = this.position;
    return {
      position: Position.create(col + 1, row + 3),
      size: Size.create(
        Math.max(1, this.size.width - 2),
        this.hintLines().length,
      ),
    };
  }

  /**
   * Which text slot a cell belongs to, for canvas double-click editing: the top
   * border row is the label, the field row the placeholder, everything from the
   * first hint row down is the hint. The bottom border (and outside) is null.
   */
  fieldAtCell(cell: Position): FieldName | null {
    const { col, row } = this.position;
    const withinCols = cell.col >= col && cell.col < col + this.size.width;
    if (!withinCols) {
      return null;
    }
    if (cell.row === row) return "label";
    if (cell.row === row + 1) return "placeholder";
    if (cell.row >= row + 3 && cell.row < row + this.size.height) return "hint";
    return null;
  }
}
