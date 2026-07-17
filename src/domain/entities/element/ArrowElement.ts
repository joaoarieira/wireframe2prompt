import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

export type ArrowDirection = "right" | "left" | "up" | "down";

export interface ArrowElementProps extends ElementBaseProps {
  direction: ArrowDirection;
}

export class ArrowElement extends Element {
  readonly kind = "arrow";
  public readonly direction: ArrowDirection;

  private constructor(base: ElementBaseProps, direction: ArrowDirection) {
    super(base);
    this.direction = direction;
  }

  static create(props: ArrowElementProps): ArrowElement {
    const { direction, ...base } = props;
    return new ArrowElement(base, direction);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): ArrowElement {
    return new ArrowElement(
      { ...this.baseProps(), ...overrides },
      this.direction,
    );
  }

  withDirection(direction: ArrowDirection): ArrowElement {
    return new ArrowElement(this.baseProps(), direction);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): ArrowElement {
    if (
      patch.direction === "right" ||
      patch.direction === "left" ||
      patch.direction === "up" ||
      patch.direction === "down"
    ) {
      return this.withDirection(patch.direction);
    }
    return this;
  }
}
