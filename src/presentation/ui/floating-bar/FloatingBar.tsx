import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

/**
 * The raised, rounded surface used for the canvas's floating tool bar. Owns the
 * design system's box radius/border/shadow so features only pass positioning
 * and layout via `className`.
 *
 * @example
 * <FloatingBar className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-10">
 *   …tools…
 * </FloatingBar>
 */
export function FloatingBar({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "rounded-box border border-base-300 bg-base-100 shadow-lg",
        className,
      )}
      {...rest}
    />
  );
}
