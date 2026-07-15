import { cx } from "../class-names/classNames";

/**
 * The single place the daisyUI `btn` vocabulary is mapped. `Button` and
 * `ButtonLink` share it so an anchor styled as a button looks identical to a
 * real one. Swapping the design system means rewriting this map — nothing else.
 */
export type ButtonVariant =
  | "default"
  | "primary"
  | "neutral"
  | "ghost"
  | "danger";
export type ButtonSize = "xs" | "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: "",
  primary: "btn-primary",
  neutral: "btn-neutral",
  ghost: "btn-ghost",
  // destructive action: outlined so it never competes with `primary`
  danger: "btn-outline btn-error",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
};

/**
 * @example buttonClasses("danger", "sm", false) // "btn btn-outline btn-error btn-sm"
 */
export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  active: boolean,
  className?: string,
): string {
  return cx(
    "btn",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    active && "btn-active",
    className,
  );
}
