import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { BorderStyle } from "../../value-objects/border-style/BorderStyle";

export interface BoxElementProps extends ElementBaseProps {
  borderStyle?: BorderStyle;
}

export class BoxElement extends Element {
  readonly kind = "box";
  public readonly borderStyle: BorderStyle;

  private constructor(base: ElementBaseProps, borderStyle: BorderStyle) {
    super(base);
    this.borderStyle = borderStyle;
  }

  static create(props: BoxElementProps): BoxElement {
    const { borderStyle, ...base } = props;
    return new BoxElement(base, borderStyle ?? BorderStyle.ascii());
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): BoxElement {
    return new BoxElement(
      { ...this.baseProps(), ...overrides },
      this.borderStyle,
    );
  }

  withBorderStyle(borderStyle: BorderStyle): BoxElement {
    return new BoxElement(this.baseProps(), borderStyle);
  }

  withProps(patch: Readonly<Record<string, unknown>>): BoxElement {
    if (patch.borderStyle instanceof BorderStyle) {
      return this.withBorderStyle(patch.borderStyle);
    }
    return this;
  }
}
