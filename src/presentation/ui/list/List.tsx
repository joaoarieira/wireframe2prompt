import type { ComponentProps } from "react";
import { cx } from "../class-names/classNames";

interface ListProps extends ComponentProps<"ul"> {
  /** Round the list into a card surface (daisyUI rounded-box). */
  rounded?: boolean;
}

/**
 * daisyUI `list` (a `<ul>`). `rounded` turns it into a boxed card.
 *
 * @example <List rounded className="bg-base-200">{rows}</List>
 */
export function List({ rounded = false, className, ...rest }: ListProps) {
  return (
    <ul className={cx("list", rounded && "rounded-box", className)} {...rest} />
  );
}

/**
 * A row inside a {@link List} (daisyUI `list-row`, rendered as `<li>`).
 *
 * @example <ListRow onClick={select}>{cells}</ListRow>
 */
export function ListRow({ className, ...rest }: ComponentProps<"li">) {
  return <li className={cx("list-row", className)} {...rest} />;
}

interface ListCellProps extends ComponentProps<"span"> {
  /** Take the remaining width in the row (daisyUI list-col-grow). */
  grow?: boolean;
}

/**
 * A cell within a {@link ListRow}; `grow` makes it absorb the leftover width.
 *
 * @example <ListCell grow className="truncate">{name}</ListCell>
 */
export function ListCell({ grow = false, className, ...rest }: ListCellProps) {
  return <span className={cx(grow && "list-col-grow", className)} {...rest} />;
}
