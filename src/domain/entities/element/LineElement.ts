import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

export type LineOrientation = "h" | "v";

export interface LineElementProps extends ElementBaseProps {
  orientation: LineOrientation;
}

export class LineElement extends Element {
  readonly kind = "line";
  public readonly orientation: LineOrientation;

  private constructor(base: ElementBaseProps, orientation: LineOrientation) {
    super(base);
    this.orientation = orientation;
  }

  static create(props: LineElementProps): LineElement {
    const { orientation, ...base } = props;
    return new LineElement(base, orientation);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): LineElement {
    return new LineElement(
      { ...this.baseProps(), ...overrides },
      this.orientation,
    );
  }

  withOrientation(orientation: LineOrientation): LineElement {
    return new LineElement(this.baseProps(), orientation);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): LineElement {
    if (patch.orientation === "h" || patch.orientation === "v") {
      return this.withOrientation(patch.orientation);
    }
    return this;
  }
}
