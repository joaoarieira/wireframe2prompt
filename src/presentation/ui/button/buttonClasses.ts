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
 * On coarse (touch) pointers every button meets the 44×44px minimum tap target,
 * regardless of its visual `size`. Applied once here so features never have to
 * remember it. Fine (mouse) pointers keep the compact size.
 */
const COARSE_TOUCH_TARGET =
  "[@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11";

/**
 * Compact buttons skip that inflation below `lg`: in a crowded strip (the tool
 * palette) the buttons keep their visual size on phones/tablets — `btn-sm`'s
 * 32px still clears WCAG 2.5.8's 24px minimum — and the 44px floor returns on
 * desktop widths, where space is not scarce.
 */
const COARSE_TOUCH_TARGET_COMPACT =
  "lg:[@media(pointer:coarse)]:min-h-11 lg:[@media(pointer:coarse)]:min-w-11";

/**
 * @example buttonClasses("danger", "sm", false) // "btn btn-outline btn-error btn-sm"
 */
export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  active: boolean,
  className?: string,
  compact = false,
): string {
  return cx(
    "btn",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    compact ? COARSE_TOUCH_TARGET_COMPACT : COARSE_TOUCH_TARGET,
    active && "btn-active",
    className,
  );
}
