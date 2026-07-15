import type { ComponentProps, ReactNode } from "react";
import { cx } from "../class-names/classNames";

interface FieldProps extends Omit<ComponentProps<"fieldset">, "children"> {
  legend: ReactNode;
  children: ReactNode;
}

/**
 * A labelled group: daisyUI `fieldset` with its `fieldset-legend`. Wrap one or
 * more controls; the `legend` is the caption above them.
 *
 * @example
 * <Field legend="Name"><TextInput value={name} onChange={onName} /></Field>
 */
export function Field({ legend, children, className, ...rest }: FieldProps) {
  return (
    <fieldset className={cx("fieldset", className)} {...rest}>
      <legend className="fieldset-legend">{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Inline caption for a single control (daisyUI `label`); use `htmlFor` to tie
 * it to the input's `id`.
 *
 * @example <FieldLabel htmlFor="col">Col</FieldLabel>
 */
export function FieldLabel({ className, ...rest }: ComponentProps<"label">) {
  return <label className={cx("label", className)} {...rest} />;
}
