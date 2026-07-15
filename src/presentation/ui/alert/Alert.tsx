import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

type AlertVariant = "info" | "success" | "warning" | "error";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
};

interface AlertProps extends ComponentProps<"div"> {
  variant?: AlertVariant;
}

/**
 * daisyUI `alert` banner. `variant` sets the semantic tone.
 *
 * @example <Alert variant="warning"><span>Document not found</span></Alert>
 */
export function Alert({ variant = "info", className, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      className={cx("alert", VARIANT_CLASSES[variant], className)}
      {...rest}
    />
  );
}
