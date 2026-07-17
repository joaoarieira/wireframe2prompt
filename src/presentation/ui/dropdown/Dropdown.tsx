import type { ComponentProps, ReactNode } from "react";
import { cx } from "../class-names/classNames";
import { buttonClasses } from "../button/buttonClasses";

interface DropdownProps {
  /** Content of the always-present trigger button (typically an icon). */
  trigger: ReactNode;
  /** Accessible name for the icon-only trigger (features pass a `t(...)`). */
  triggerLabel: string;
  /** Highlights the trigger while one of its menu options is active. */
  triggerActive?: boolean;
  /** Menu options — compose {@link DropdownItem}. */
  children: ReactNode;
  /**
   * Layout only, merged onto the trigger button so a Dropdown can be a segment
   * of a {@link ButtonGroup} (which stamps `join-item` onto its children).
   */
  className?: string;
}

/**
 * daisyUI `dropdown` that opens upward (`dropdown-top`, aligned `dropdown-end`)
 * — used by the tool palette's grouped tools. The menu is CSS-driven: it shows
 * while the trigger or menu holds focus, so no open/close state leaks into
 * features. Picking a {@link DropdownItem} blurs it, which closes the menu.
 *
 * @example
 * <Dropdown trigger={<ChevronUp />} triggerLabel="More shape tools">
 *   <DropdownItem onClick={pickBox}>Box</DropdownItem>
 * </Dropdown>
 */
export function Dropdown({
  trigger,
  triggerLabel,
  triggerActive = false,
  children,
  className,
}: DropdownProps) {
  return (
    <div className="dropdown dropdown-top dropdown-end">
      <div
        tabIndex={0}
        role="button"
        aria-label={triggerLabel}
        className={buttonClasses(
          triggerActive ? "neutral" : "ghost",
          "sm",
          false,
          className,
        )}
      >
        {trigger}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-10 mb-1 w-max rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      >
        {children}
      </ul>
    </div>
  );
}

interface DropdownItemProps extends ComponentProps<"button"> {
  /** Marks the currently selected option (daisyUI `menu-active`). */
  active?: boolean;
}

/**
 * One option inside a {@link Dropdown} menu, rendered as a `menu` row. Its click
 * runs the caller's handler and then blurs itself, which drops focus out of the
 * dropdown and lets the CSS close the menu.
 *
 * @example <DropdownItem active onClick={pickLine}>Line</DropdownItem>
 */
export function DropdownItem({
  active = false,
  className,
  onClick,
  type = "button",
  ...rest
}: DropdownItemProps) {
  return (
    <li>
      <button
        type={type}
        className={cx(active && "menu-active", className)}
        onClick={(event) => {
          onClick?.(event);
          // close the focus-driven menu now that an option was chosen
          event.currentTarget.blur();
        }}
        {...rest}
      />
    </li>
  );
}
