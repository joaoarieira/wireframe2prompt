import type { ComponentProps } from "react";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonClasses";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  /**
   * Keeps the visual size on small (below `lg`) touch screens instead of
   * inflating to the 44px tap floor — for dense strips like the tool palette.
   */
  compact?: boolean;
}

/**
 * The app's button. Features pick a semantic `variant`/`size`; the daisyUI
 * classes live behind {@link buttonClasses}. `className` is for layout only
 * (margins, width). Defaults to `type="button"` so it never submits a form.
 *
 * @example <Button variant="primary" onClick={save}>Save</Button>
 */
export function Button({
  variant = "default",
  size = "md",
  active = false,
  compact = false,
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, active, className, compact)}
      {...rest}
    />
  );
}
