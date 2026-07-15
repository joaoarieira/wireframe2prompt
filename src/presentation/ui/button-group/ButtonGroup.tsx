import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../class-names/classNames";

interface ButtonGroupProps extends ComponentProps<"div"> {
  children: ReactNode;
}

/** A child that can receive a merged className (Button, TextInput, …). */
type ClassedChild = ReactElement<{ className?: string }>;

/**
 * daisyUI `join`: renders a segmented group and stamps `join-item` onto each
 * direct child so features never write the coupling class themselves. Any
 * primitive that merges an incoming `className` (Button, TextInput) can be a
 * child.
 *
 * @example
 * <ButtonGroup>
 *   <Button>Undo</Button>
 *   <Button>Redo</Button>
 * </ButtonGroup>
 */
export function ButtonGroup({
  children,
  className,
  ...rest
}: ButtonGroupProps) {
  return (
    <div role="group" className={cx("join", className)} {...rest}>
      {withJoinItem(children)}
    </div>
  );
}

/**
 * Merges daisyUI's `join-item` into each segment. cloneElement is the right
 * tool here — the group has to inject a class into arbitrary child primitives
 * (Button, TextInput) it doesn't own — so the react-x cautions are suppressed
 * deliberately and kept contained to this one helper.
 */
function withJoinItem(children: ReactNode): ReactNode {
  // eslint-disable-next-line react-x/no-children-map -- grouped-control class injection
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }
    const typed = child as ClassedChild;
    // eslint-disable-next-line react-x/no-clone-element -- grouped-control class injection
    return cloneElement(typed, {
      className: cx("join-item", typed.props.className),
    });
  });
}
