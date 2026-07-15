import { describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ButtonLink } from "./ButtonLink";

// The router Link needs a RouterProvider; for a class-contract test a plain
// anchor is enough. Mock createLink to just style the anchor and map to→href.
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

describe("ButtonLink", () => {
  test("renders an anchor styled as a button", () => {
    render(
      <ButtonLink to="/" variant="ghost" size="sm">
        Documents
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Documents" });
    expect(link).toHaveClass("btn", "btn-ghost", "btn-sm");
    expect(link).toHaveAttribute("href", "/");
  });

  test("merges a layout className", () => {
    render(
      <ButtonLink to="/" className="mt-2">
        Home
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "btn",
      "mt-2",
    );
  });
});
