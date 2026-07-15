import { describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { TextLink } from "./TextLink";

vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

describe("TextLink", () => {
  test("styles the router link as an inline link", () => {
    render(
      <TextLink to="/" className="p-2">
        Open
      </TextLink>,
    );
    const link = screen.getByRole("link", { name: "Open" });
    expect(link).toHaveClass("link", "link-hover", "p-2");
    expect(link).not.toHaveClass("list-col-grow");
  });

  test("grow makes it the stretching list column", () => {
    render(
      <TextLink to="/" grow>
        Open
      </TextLink>,
    );
    expect(screen.getByRole("link", { name: "Open" })).toHaveClass(
      "list-col-grow",
    );
  });
});
