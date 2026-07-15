import type { ComponentProps } from "react";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "../button/buttonClasses";

interface ButtonLinkAnchorProps extends ComponentProps<"a"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

// The styled anchor createLink wires router behaviour onto. Shares the exact
// button class map so an action-link is indistinguishable from a real Button.
function ButtonLinkAnchor({
  variant = "default",
  size = "md",
  active = false,
  className,
  ...rest
}: ButtonLinkAnchorProps) {
  return (
    <a className={buttonClasses(variant, size, active, className)} {...rest} />
  );
}

const CreatedButtonLink = createLink(ButtonLinkAnchor);

/**
 * A router `Link` that looks like a Button — for navigation that should read as
 * an action ("← Documents", "Back to documents"). Keeps TanStack's type-safe
 * `to`/`params`.
 *
 * @example <ButtonLink to="/" variant="ghost" size="sm">← Documents</ButtonLink>
 */
export const ButtonLink: LinkComponent<typeof ButtonLinkAnchor> = (props) => (
  <CreatedButtonLink {...props} />
);
