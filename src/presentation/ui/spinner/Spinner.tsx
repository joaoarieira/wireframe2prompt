import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

type SpinnerSize = "xs" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: "loading-xs",
  md: "",
  lg: "loading-lg",
};

interface SpinnerProps extends ComponentProps<"span"> {
  size?: SpinnerSize;
}

/**
 * Indeterminate loading spinner (daisyUI `loading loading-spinner`).
 *
 * @example <Spinner size="lg" />
 */
export function Spinner({ size = "md", className, ...rest }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cx("loading loading-spinner", SIZE_CLASSES[size], className)}
      {...rest}
    />
  );
}
