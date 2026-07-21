import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AboutPage } from "./AboutPage";

const back = vi.fn();

// ButtonLink calls createLink at module import, so the mock must expose it.
// vi.mock is hoisted, so it is in place before the primitive loads. The router
// `to` becomes a plain `href` so the CTA renders as a real link we can assert.
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ history: { back } }),
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AboutPage", () => {
  test("renders the product name in the header", () => {
    render(<AboutPage />);
    expect(screen.getByText("wireframe2prompt")).toBeInTheDocument();
  });

  test("sets the about tab title", () => {
    render(<AboutPage />);
    expect(document.title).toBe("About — wireframe2prompt");
  });

  test("the back button returns to the previous route via history", () => {
    render(<AboutPage />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(back).toHaveBeenCalledOnce();
  });

  test("renders every section heading", () => {
    render(<AboutPage />);

    for (const name of [
      "About",
      "How to use",
      "Where to use it",
      "Fast prototyping first",
      "Examples",
      "Contribute",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  test("lists the three how-to-use steps and the three uses", () => {
    render(<AboutPage />);

    expect(
      screen.getByText("Select a component from the palette."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enrich its position, size, text."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Export everything as plain text."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("As a prompt for an AI to build the real UI."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Inside a GitHub issue to describe a layout."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "As a comment in your code, next to the implementation.",
      ),
    ).toBeInTheDocument();
  });

  test("splits the philosophy into its three cards", () => {
    render(<AboutPage />);

    expect(
      screen.getByText("The point is speed, not fidelity."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No tools or exports required."),
    ).toBeInTheDocument();
  });

  test("renders both ASCII examples", () => {
    render(<AboutPage />);

    expect(screen.getByText(/I'm Feeling Lucky/)).toBeInTheDocument();
    expect(screen.getByText(/Create your first playlist/)).toBeInTheDocument();
  });

  test("the contribute link points to the public repository", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("link", { name: "Open the repository on GitHub" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/joaoarieira/wireframe2prompt",
    );
  });

  test("renders the Start now CTA", () => {
    render(<AboutPage />);
    expect(screen.getByRole("link", { name: "Start now" })).toBeInTheDocument();
  });

  test("renders the shared sidebar footer", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("button", { name: "Change theme" }),
    ).toBeInTheDocument();
  });
});
