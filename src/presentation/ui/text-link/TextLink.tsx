import type { ComponentProps } from "react";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import { cx } from "../class-names/classNames";

interface TextLinkAnchorProps extends ComponentProps<"a"> {
  /** Take the growing column inside a ListRow (daisyUI list-col-grow). */
  grow?: boolean;
}

// The styled anchor createLink wires router behaviour onto. Kept private so the
// daisyUI `link` classes never leak past this module.
function TextLinkAnchor({
  grow = false,
  className,
  ...rest
}: TextLinkAnchorProps) {
  return (
    <a
      className={cx("link link-hover", grow && "list-col-grow", className)}
      {...rest}
    />
  );
}

const CreatedTextLink = createLink(TextLinkAnchor);

/**
 * A router `Link` with the design system's inline-link styling. `grow` lets it
 * be the stretching cell of a list row. Keeps TanStack's type-safe `to`/`params`.
 *
 * @example <TextLink to="/editor/$documentId" params={{ documentId }} grow>{name}</TextLink>
 */
export const TextLink: LinkComponent<typeof TextLinkAnchor> = (props) => (
  <CreatedTextLink {...props} />
);
