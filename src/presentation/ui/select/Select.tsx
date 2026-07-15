import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

/**
 * Dropdown select; pass `<option>`s as children. Inherits native `<select>`
 * props (`value`, `onChange`, `aria-label`…).
 *
 * @example
 * <Select value={orientation} onChange={onOrientation}>
 *   <option value="h">Horizontal</option>
 * </Select>
 */
export function Select({ className, ...rest }: ComponentProps<"select">) {
  return <select className={cx("select select-sm", className)} {...rest} />;
}
