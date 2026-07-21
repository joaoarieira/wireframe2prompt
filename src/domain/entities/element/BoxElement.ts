import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

/** A plain bordered rectangle. Its only styling is the shared border style. */
export class BoxElement extends Element {
  readonly kind = "box";

  get hasBorder(): boolean {
    return true;
  }

  static create(props: ElementBaseProps): BoxElement {
    return new BoxElement(props);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): BoxElement {
    return new BoxElement({ ...this.baseProps(), ...overrides });
  }

  protected withKindProps(): BoxElement {
    return this;
  }
}
