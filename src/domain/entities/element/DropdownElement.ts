import { FieldElement } from "./FieldElement";
import type { FieldElementProps } from "./FieldElement";
import type { ElementBaseProps } from "./Element";

/** A dropdown/select: identical to {@link InputElement} but the field row
 * reserves a `▼` indicator to the right of the placeholder. */
export class DropdownElement extends FieldElement {
  readonly kind = "dropdown";

  get showsArrow(): boolean {
    return true;
  }

  static create(props: FieldElementProps): DropdownElement {
    const { label, placeholder, hint, ...base } = props;
    return new DropdownElement(
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
  ): DropdownElement {
    return new DropdownElement(base, label, placeholder, hint);
  }
}
