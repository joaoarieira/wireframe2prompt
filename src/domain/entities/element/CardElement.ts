import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

export interface CardElementProps extends ElementBaseProps {
  title: string | null;
}

export class CardElement extends Element {
  readonly kind = "card";
  public readonly title: string | null;

  private constructor(base: ElementBaseProps, title: string | null) {
    super(base);
    this.title = title;
  }

  static create(props: CardElementProps): CardElement {
    const { title, ...base } = props;
    return new CardElement(base, title);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): CardElement {
    return new CardElement(
      { ...this.baseProps(), ...overrides },
      this.title,
    );
  }

  withTitle(title: string | null): CardElement {
    return new CardElement(this.baseProps(), title);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): CardElement {
    if (typeof patch.title === "string" || patch.title === null) {
      return this.withTitle(patch.title as string | null);
    }
    return this;
  }
}
