import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";

export interface ModalElementProps extends ElementBaseProps {
  title: string | null;
}

export class ModalElement extends Element {
  readonly kind = "modal";
  public readonly title: string | null;

  get hasBorder(): boolean {
    return true;
  }

  private constructor(base: ElementBaseProps, title: string | null) {
    super(base);
    this.title = title;
  }

  static create(props: ModalElementProps): ModalElement {
    const { title, ...base } = props;
    return new ModalElement(base, title);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): ModalElement {
    return new ModalElement({ ...this.baseProps(), ...overrides }, this.title);
  }

  withTitle(title: string | null): ModalElement {
    return new ModalElement(this.baseProps(), title);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): ModalElement {
    if (typeof patch.title === "string" || patch.title === null) {
      return this.withTitle(patch.title as string | null);
    }
    return this;
  }
}
