import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

export interface TextElementProps extends ElementBaseProps {
  text: string;
}

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
    return new TextElement(this.baseProps(), text);
  }

  withProps(patch: Readonly<Record<string, unknown>>): TextElement {
    if (typeof patch.text === "string") {
      return this.withText(patch.text);
    }
    return this;
  }
}
