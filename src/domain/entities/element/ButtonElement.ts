import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

export interface ButtonElementProps extends ElementBaseProps {
  text: string;
}

/** A grid rectangle: where the label block sits inside the button (for the overlay). */
export interface ButtonTextRegion {
  position: Position;
  size: Size;
}

/**
 * A bordered button with a (possibly multi-line) label kept centered both
 * horizontally and vertically inside its box. The box never shrinks below what
 * the label needs: {@link fitSize} grows the width to the right and the height
 * downward (the top-left corner is fixed) so a longer label or an extra line
 * always fits. A resize keeps the requested box but is clamped up to that
 * minimum. The glyph mapper reads {@link textLines}, {@link textStartCol} and
 * {@link textTopRow} so nothing hardcodes the geometry.
 */
export class ButtonElement extends Element {
  readonly kind = "button";
  public readonly text: string;

  get hasBorder(): boolean {
    return true;
  }

  private constructor(base: ElementBaseProps, text: string) {
    super(base);
    this.text = text;
  }

  static create(props: ButtonElementProps): ButtonElement {
    const { text, ...base } = props;
    return new ButtonElement(
      { ...base, size: ButtonElement.fitSize(base.size, text) },
      text,
    );
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): ButtonElement {
    return new ButtonElement({ ...this.baseProps(), ...overrides }, this.text);
  }

  /**
   * New instance with a different label, grown to fit it. The top-left corner
   * stays put, so a wider label extends the box to the right and extra lines
   * extend it downward.
   */
  withText(text: string): ButtonElement {
    return new ButtonElement(
      { ...this.baseProps(), size: ButtonElement.fitSize(this.size, text) },
      text,
    );
  }

  /** A resize keeps the requested box but never smaller than the label needs. */
  resize(size: Size): ButtonElement {
    return this.cloneWith({ size: ButtonElement.fitSize(size, this.text) });
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): ButtonElement {
    if (typeof patch.text === "string") {
      return this.withText(patch.text);
    }
    return this;
  }

  /** The label split into its `\n`-separated lines (always at least one). */
  textLines(): string[] {
    return this.text.split("\n");
  }

  /** Content box the label occupies: widest line × line count (never < 0). */
  private static contentSize(text: string): { cols: number; rows: number } {
    const lines = text.split("\n");
    const cols = Math.max(0, ...lines.map((line) => [...line].length));
    return { cols, rows: lines.length };
  }

  /** Grows `size` (only) so the box holds the label plus its two borders. */
  static fitSize(size: Size, text: string): Size {
    const { cols, rows } = ButtonElement.contentSize(text);
    return Size.create(
      Math.max(size.width, cols + 2),
      Math.max(size.height, rows + 2),
    );
  }

  /** Cells available for the label between the two side borders (never < 0). */
  innerTextWidth(): number {
    return Math.max(0, this.size.width - 2);
  }

  /** Cells available for the label between the top and bottom borders (never < 0). */
  innerTextHeight(): number {
    return Math.max(0, this.size.height - 2);
  }

  /** Top row of the vertically centered label block. */
  textTopRow(): number {
    const rows = this.textLines().length;
    const padding = Math.max(
      0,
      Math.floor((this.innerTextHeight() - rows) / 2),
    );
    return this.position.row + 1 + padding;
  }

  /** Column where a line of `length` chars starts to sit horizontally centered. */
  textStartCol(length: number): number {
    const padding = Math.max(
      0,
      Math.floor((this.innerTextWidth() - length) / 2),
    );
    return this.position.col + 1 + padding;
  }

  /** Editable region of the centered label block, for the inline overlay. */
  textRegion(): ButtonTextRegion {
    const { cols, rows } = ButtonElement.contentSize(this.text);
    return {
      position: Position.create(this.textStartCol(cols), this.textTopRow()),
      size: Size.create(Math.max(1, cols), Math.max(1, rows)),
    };
  }
}
