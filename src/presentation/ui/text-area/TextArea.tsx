import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

/**
 * Multi-line text control. Inherits every native `<textarea>` prop (`rows`,
 * `value`, `onChange`, `onKeyDown`, `aria-label`…).
 *
 * @example <TextArea rows={3} value={text} onChange={onText} className="w-full" />
 */
export function TextArea({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea className={cx("textarea textarea-sm", className)} {...rest} />
  );
}
