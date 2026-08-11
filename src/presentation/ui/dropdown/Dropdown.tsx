import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { cx } from "../class-names/classNames";
import { buttonClasses } from "../button/buttonClasses";

interface DropdownProps {
  /** Content of the always-present trigger button (typically an icon). */
  trigger: ReactNode;
  /** Accessible name for the icon-only trigger (features pass a `t(...)`). */
  triggerLabel: string;
  /** Highlights the trigger while one of its menu options is active. */
  triggerActive?: boolean;
  /**
   * Keeps the trigger's visual size on small (below `lg`) touch screens
   * instead of inflating to the 44px tap floor — see `Button`'s `compact`.
   */
  triggerCompact?: boolean;
  /** Optional header shown above the options (daisyUI `menu-title`). */
  menuLabel?: string;
  /**
   * Opens the menu downward on small (below `lg`) touch screens while keeping
   * the default upward opening on desktop. Use where the trigger sits near the
   * top of a mobile viewport and an upward menu would be clipped off-screen.
   */
  openDownOnMobile?: boolean;
  /**
   * Opens the menu downward on every screen size. Use where the trigger sits at
   * the top of the page (e.g. a row of the document list), so an upward menu
   * would run off-screen. Takes precedence over {@link openDownOnMobile}.
   */
  openDown?: boolean;
  /**
   * Renders the menu in the top layer via the native Popover API (anchored to
   * the trigger) instead of as an in-flow `dropdown-content`. Use inside a
   * clipped/scrolling container (e.g. the footer's horizontally scrolling tool
   * strip): the menu escapes the clip without the container having to drop its
   * `overflow`, so the strip keeps its scroll position and hidden items stay
   * hidden while the menu is open.
   */
  overlay?: boolean;
  /** Menu options — compose {@link DropdownItem}. */
  children: ReactNode;
  /**
   * Layout only, merged onto the trigger button so a Dropdown can be a segment
   * of a {@link ButtonGroup} (which stamps `join-item` onto its children).
   */
  className?: string;
}

/** daisyUI menu box shared by both the in-flow and the top-layer variants. */
const MENU_BOX =
  "menu z-10 w-max rounded-box border border-base-300 bg-base-100 p-1 shadow-lg";

interface MenuDirection {
  /** Placement classes for the `dropdown` root (or the popover menu). */
  placement: string;
  /** Gap classes, always on the side the menu opens from. */
  gap: string;
}

/** Resolves the three placements (always down, down-on-mobile, always up). */
function menuDirection(
  openDown: boolean,
  openDownOnMobile: boolean,
): MenuDirection {
  if (openDown) {
    return { placement: "dropdown-bottom", gap: "mt-1" };
  }
  if (openDownOnMobile) {
    return {
      placement: "dropdown-bottom lg:dropdown-top",
      gap: "mt-1 lg:mt-0 lg:mb-1",
    };
  }
  return { placement: "dropdown-top", gap: "mb-1" };
}

/**
 * daisyUI `dropdown` that opens upward (`dropdown-top`, aligned `dropdown-end`)
 * — used by the tool palette's grouped tools. By default the menu is CSS-driven:
 * it shows while the trigger or menu holds focus, so no open/close state leaks
 * into features. Picking a {@link DropdownItem} blurs it, which closes the menu.
 *
 * With `overlay`, the menu instead rides the native Popover API's top layer so
 * it can escape a clipping/scrolling ancestor (see {@link DropdownProps.overlay}).
 *
 * @example
 * <Dropdown trigger={<ChevronUp />} triggerLabel="More shape tools">
 *   <DropdownItem onClick={pickBox}>Box</DropdownItem>
 * </Dropdown>
 */
export function Dropdown(props: DropdownProps) {
  return props.overlay ? (
    <OverlayDropdown {...props} />
  ) : (
    <FocusDropdown {...props} />
  );
}

/** The menu-title header plus the caller's options — shared by both variants. */
function MenuContent({
  menuLabel,
  children,
}: Pick<DropdownProps, "menuLabel" | "children">) {
  return (
    <>
      {menuLabel !== undefined && <li className="menu-title">{menuLabel}</li>}
      {children}
    </>
  );
}

/** In-flow, focus-driven dropdown (the default). */
function FocusDropdown({
  trigger,
  triggerLabel,
  triggerActive = false,
  triggerCompact = false,
  menuLabel,
  openDownOnMobile = false,
  openDown = false,
  children,
  className,
}: DropdownProps) {
  const direction = menuDirection(openDown, openDownOnMobile);
  return (
    // data-ui-dropdown lets scroll containers detect "a dropdown menu is open"
    // via `has-[[data-ui-dropdown]:focus-within]` without referencing the
    // daisyUI `dropdown` class outside ui/.
    <div
      data-ui-dropdown
      className={cx("dropdown dropdown-end", direction.placement)}
    >
      <div
        tabIndex={0}
        role="button"
        aria-label={triggerLabel}
        className={buttonClasses(
          triggerActive ? "neutral" : "ghost",
          "sm",
          false,
          className,
          triggerCompact,
        )}
      >
        {trigger}
      </div>
      <ul
        tabIndex={0}
        // The gap sits on the side the menu opens from — see menuDirection.
        className={cx("dropdown-content", MENU_BOX, direction.gap)}
      >
        <MenuContent menuLabel={menuLabel}>{children}</MenuContent>
      </ul>
    </div>
  );
}

/**
 * Top-layer variant: the trigger is a real `<button popovertarget>` and the
 * menu is a `[popover]` list anchored to it (CSS anchor positioning). Because
 * an open popover is promoted to the top layer, it renders in full even when an
 * ancestor clips or scrolls — so the container never has to lift its overflow.
 */
function OverlayDropdown({
  trigger,
  triggerLabel,
  triggerActive = false,
  triggerCompact = false,
  menuLabel,
  openDownOnMobile = false,
  openDown = false,
  children,
  className,
}: DropdownProps) {
  const direction = menuDirection(openDown, openDownOnMobile);
  const menuId = useId();
  // anchor-name must be a dashed-ident; useId's value carries separators.
  const anchorName = `--dd-${menuId.replace(/[^a-z0-9]/gi, "")}`;
  const triggerStyle = { anchorName } as CSSProperties;
  const menuStyle = { positionAnchor: anchorName } as CSSProperties;
  return (
    <>
      <button
        type="button"
        popoverTarget={menuId}
        aria-label={triggerLabel}
        style={triggerStyle}
        className={buttonClasses(
          triggerActive ? "neutral" : "ghost",
          "sm",
          false,
          className,
          triggerCompact,
        )}
      >
        {trigger}
      </button>
      <ul
        popover="auto"
        id={menuId}
        style={menuStyle}
        className={cx(
          "dropdown dropdown-end",
          MENU_BOX,
          direction.placement,
          direction.gap,
        )}
      >
        <MenuContent menuLabel={menuLabel}>{children}</MenuContent>
      </ul>
    </>
  );
}

interface DropdownItemProps extends ComponentProps<"button"> {
  /** Marks the currently selected option (daisyUI `menu-active`). */
  active?: boolean;
}

/**
 * One option inside a {@link Dropdown} menu, rendered as a `menu` row. Its click
 * runs the caller's handler and then dismisses the menu: it hides an ancestor
 * `[popover]` (the {@link Dropdown} `overlay` variant) or, failing that, blurs
 * itself so the focus-driven menu closes.
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
          // close the menu now that an option was chosen: a top-layer popover
          // via hidePopover, else drop focus so the focus-driven menu closes.
          const popover = event.currentTarget.closest<HTMLElement>("[popover]");
          if (popover?.hidePopover) {
            popover.hidePopover();
          } else {
            event.currentTarget.blur();
          }
        }}
        {...rest}
      />
    </li>
  );
}
