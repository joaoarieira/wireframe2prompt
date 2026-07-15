import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

/**
 * Small text/number input. Inherits every native `<input>` prop (`type`,
 * `value`, `onChange`, `aria-label`, `id`, `min`…); `className` is for layout
 * (`w-16`, `flex-1`).
 *
 * @example <TextInput type="number" value={col} onChange={onCol} className="w-16" />
 */
export function TextInput({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cx("input input-sm", className)} {...rest} />;
}
