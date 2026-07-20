import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LayersSidebarFooter } from "./LayersSidebarFooter";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../hooks/useLanguage";

vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

vi.mock("../../hooks/useTheme", () => ({ useTheme: vi.fn() }));
vi.mock("../../hooks/useLanguage", () => ({ useLanguage: vi.fn() }));

const setPreference = vi.fn();
const setLanguage = vi.fn();

function mockHooks(
  preference: "system" | "light" | "dark" = "system",
  language: "en" | "pt" = "en",
) {
  vi.mocked(useTheme).mockReturnValue({ preference, setPreference });
  vi.mocked(useLanguage).mockReturnValue({ language, setLanguage });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LayersSidebarFooter", () => {
  test("about link points to /about", () => {
    mockHooks("light");
    render(<LayersSidebarFooter />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  test("github button opens the repo in a new tab", () => {
    mockHooks("light");
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LayersSidebarFooter />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open GitHub repository" }),
    );
    expect(open).toHaveBeenCalledWith(
      "https://github.com/joaoarieira/wireframe2prompt",
      "_blank",
      "noopener,noreferrer",
    );
  });

  test("the theme picker opens with system, light, and dark options", () => {
    mockHooks("system");
    render(<LayersSidebarFooter />);

    expect(
      screen.getByRole("button", { name: "Change theme" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
  });

  test("the current theme preference is marked active", () => {
    mockHooks("dark");
    render(<LayersSidebarFooter />);

    expect(screen.getByRole("button", { name: "Dark" })).toHaveClass(
      "menu-active",
    );
    expect(screen.getByRole("button", { name: "System" })).not.toHaveClass(
      "menu-active",
    );
  });

  test("picking a theme option calls setPreference with that value", () => {
    mockHooks("system");
    render(<LayersSidebarFooter />);

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(setPreference).toHaveBeenCalledWith("light");
  });

  test("the language picker opens with an option per supported language", () => {
    mockHooks("light");
    render(<LayersSidebarFooter />);

    expect(
      screen.getByRole("button", { name: "Switch language" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Português" }),
    ).toBeInTheDocument();
  });

  test("the current language option is marked active", () => {
    mockHooks("light", "pt");
    render(<LayersSidebarFooter />);

    expect(screen.getByRole("button", { name: "Português" })).toHaveClass(
      "menu-active",
    );
    expect(screen.getByRole("button", { name: "English" })).not.toHaveClass(
      "menu-active",
    );
  });

  test("picking a language calls setLanguage with that code", () => {
    mockHooks("light");
    render(<LayersSidebarFooter />);

    fireEvent.click(screen.getByRole("button", { name: "Português" }));
    expect(setLanguage).toHaveBeenCalledWith("pt");
  });
});
