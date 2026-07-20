import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LayersSidebarHeader } from "./LayersSidebarHeader";
import { editorStore } from "../../state/app-store/appStore";

// The router Link needs a RouterProvider; only ButtonLink touches the router,
// so createLink is mocked to a styled anchor (same as ButtonLink.spec).
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

afterEach(() => {
  cleanup();
  editorStore.setState({
    canUndo: false,
    canRedo: false,
  });
  vi.restoreAllMocks();
});

describe("LayersSidebarHeader", () => {
  test("back link points to the document list", () => {
    render(<LayersSidebarHeader />);
    expect(
      screen.getByRole("link", { name: "Back to wireframes" }),
    ).toHaveAttribute("href", "/");
  });

  test("undo is disabled when it cannot undo", () => {
    editorStore.setState({ canUndo: false });
    render(<LayersSidebarHeader />);
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });

  test("redo is disabled when it cannot redo", () => {
    editorStore.setState({ canRedo: false });
    render(<LayersSidebarHeader />);
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  test("clicking undo calls the store's undo action", () => {
    const undo = vi.fn();
    editorStore.setState({ canUndo: true, undo });
    render(<LayersSidebarHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
  });

  test("clicking redo calls the store's redo action", () => {
    const redo = vi.fn();
    editorStore.setState({ canRedo: true, redo });
    render(<LayersSidebarHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(redo).toHaveBeenCalledOnce();
  });

  test("clicking save calls saveCurrentDocument", () => {
    const saveCurrentDocument = vi.fn().mockResolvedValue(undefined);
    editorStore.setState({ saveCurrentDocument });
    render(<LayersSidebarHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(saveCurrentDocument).toHaveBeenCalledOnce();
  });
});
