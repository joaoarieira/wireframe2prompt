import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { AboutPage } from "./AboutPage";

vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

afterEach(cleanup);

describe("AboutPage", () => {
  test("renders the product name in the header", () => {
    render(<AboutPage />);
    expect(screen.getByText("wireframe2prompt")).toBeInTheDocument();
  });

  test("back link points to the document list", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "← Back" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("renders the section headings and the summary", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About wireframe2prompt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What is wireframe2prompt?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How to use" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tech stack" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/exports your layouts as plain text/),
    ).toBeInTheDocument();
  });
});
