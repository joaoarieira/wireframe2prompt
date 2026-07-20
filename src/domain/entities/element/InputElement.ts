import { FieldElement } from "./FieldElement";
import type { FieldElementProps } from "./FieldElement";
import type { ElementBaseProps } from "./Element";

/** A single-line text input: label on the border, right-anchored placeholder,
 * wrapped hint below. No dropdown arrow. */
export class InputElement extends FieldElement {
  readonly kind = "input";

  get showsArrow(): boolean {
    return false;
  }

  static create(props: FieldElementProps): InputElement {
    const { label, placeholder, hint, ...base } = props;
    return new InputElement(
      { ...base, size: FieldElement.fitSize(base.size.width, hint) },
      label,
      placeholder,
      hint,
    );
  }

  protected rebuild(
    base: ElementBaseProps,
    label: string | null,
    placeholder: string | null,
    hint: string | null,
  ): InputElement {
    return new InputElement(base, label, placeholder, hint);
  }
}
