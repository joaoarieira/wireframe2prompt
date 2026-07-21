import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EditorIconRail } from "./EditorIconRail";
import { editorStore } from "../../state/app-store/appStore";

// The router Link needs a RouterProvider; only ButtonLink touches the router.
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
    saveStatus: "hidden",
    layersPanelOpen: false,
  });
  vi.restoreAllMocks();
});

describe("EditorIconRail", () => {
  test("back link points to the document list", () => {
    render(<EditorIconRail />);
    expect(
      screen.getByRole("link", { name: "Back to wireframes" }),
    ).toHaveAttribute("href", "/");
  });

  test("undo/redo are disabled when they cannot run and call the store otherwise", () => {
    const undo = vi.fn();
    editorStore.setState({ canUndo: true, canRedo: false, undo });
    render(<EditorIconRail />);

    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
  });

  test("the ☰ button toggles the layers panel", () => {
    render(<EditorIconRail />);
    expect(editorStore.getState().layersPanelOpen).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(editorStore.getState().layersPanelOpen).toBe(true);
  });
});
