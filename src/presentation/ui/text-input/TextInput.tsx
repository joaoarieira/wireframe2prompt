import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

/**
 * On coarse (touch) pointers the input grows to the 44×44px minimum tap target,
 * matching `Button`'s inflation so an input and a button sit at the same height
 * in a shared row (e.g. the "new wireframe" field). Fine (mouse) pointers keep
 * `input-sm`'s compact height.
 */
const COARSE_TOUCH_TARGET = "[@media(pointer:coarse)]:min-h-11";

/**
 * Small text/number input. Inherits every native `<input>` prop (`type`,
 * `value`, `onChange`, `aria-label`, `id`, `min`…); `className` is for layout
 * (`w-16`, `flex-1`).
 *
 * @example <TextInput type="number" value={col} onChange={onCol} className="w-16" />
 */
export function TextInput({ className, ...rest }: ComponentProps<"input">) {
  return (
    <input
      className={cx("input input-sm", COARSE_TOUCH_TARGET, className)}
      {...rest}
    />
  );
}
