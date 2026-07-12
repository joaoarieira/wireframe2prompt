import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { Size } from "../size/Size";

export interface TextElementProps extends ElementBaseProps {
  text: string;
}

/**
 * Text can span multiple lines (`\n`-separated). The element's size always
 * fits its content — {@link withText} recomputes it — so hit-testing and the
 * selection overlay stay aligned with what the glyph mapper draws.
 */
export class TextElement extends Element {
  readonly kind = "text";
  public readonly text: string;

  private constructor(base: ElementBaseProps, text: string) {
    super(base);
    this.text = text;
  }

  static create(props: TextElementProps): TextElement {
    const { text, ...base } = props;
    return new TextElement(base, text);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): TextElement {
    return new TextElement({ ...this.baseProps(), ...overrides }, this.text);
  }

  withText(text: string): TextElement {
    return new TextElement(
      { ...this.baseProps(), size: TextElement.sizeToFit(text) },
      text,
    );
  }

  /** Bounding box of the content, never smaller than 1×1 (empty text). */
  static sizeToFit(text: string): Size {
    const lines = text.split("\n");
    const widest = Math.max(...lines.map((line) => [...line].length));
    return Size.create(Math.max(1, widest), Math.max(1, lines.length));
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): TextElement {
    if (typeof patch.text === "string") {
      return this.withText(patch.text);
    }
    return this;
  }
}
