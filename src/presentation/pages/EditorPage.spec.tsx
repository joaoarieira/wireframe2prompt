import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { EditorPage } from "./EditorPage";
import { editorStore } from "../state/app-store/appStore";
import { makeDoc, makeText } from "../../tests/fixtures";
import type { ViewportBreakpoint } from "../hooks/useViewportBreakpoint";

// The router Link needs a RouterProvider; here only ButtonLink touches the
// router, so createLink is mocked to a styled anchor (same as ButtonLink.spec).
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

// The layout branches on the viewport breakpoint; each test pins it explicitly.
let breakpoint: ViewportBreakpoint = "desktop";
vi.mock("../hooks/useViewportBreakpoint", () => ({
  useViewportBreakpoint: () => breakpoint,
}));

function openReadyDocument() {
  editorStore.setState({
    document: makeDoc(makeText("t1", "hello")),
    documentStatus: "ready",
  });
}

afterEach(() => {
  cleanup();
  breakpoint = "desktop";
  act(() => {
    editorStore.getState().setActiveTool("select");
  });
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    inspectorOpen: false,
    autoOpenInspector: true,
    layersPanelOpen: false,
    canvasEditingElementId: null,
  });
});

describe("EditorPage", () => {
  test("missing document shows the not-found alert with a way back", () => {
    editorStore.setState({ documentStatus: "missing" });
    render(<EditorPage />);

    expect(screen.getByText("Wireframe not found.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to wireframes" }),
    ).toBeInTheDocument();
  });

  test("loading state shows a spinner only", () => {
    editorStore.setState({ documentStatus: "loading" });
    render(<EditorPage />);

    expect(screen.queryByTestId("canvas")).toBeNull();
    expect(document.querySelector(".loading")).not.toBeNull();
  });

  test("ready state sets the editor tab title and marks the route noindex", () => {
    openReadyDocument();
    const view = render(<EditorPage />);

    expect(document.title).toBe("Editor — wireframe2prompt");
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content"),
    ).toBe("noindex");

    view.unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  test("ready state renders the canvas and the sidebar", () => {
    openReadyDocument();
    render(<EditorPage />);

    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    // Sidebar header exposes the back action by aria-label (glyph, not text).
    expect(
      screen.getByRole("link", { name: "Back to wireframes" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-aside")).toBeNull();
  });

  test("a window tool shortcut activates the tool through the footer", () => {
    openReadyDocument();
    render(<EditorPage />);

    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    expect(editorStore.getState().activeToolId).toBe("box");
    // "Box" names both the group's quick button and its menu item; the footer's
    // quick button (outside the dropdown) is the one that reflects activation.
    const quickBox = screen
      .getAllByRole("button", { name: "Box" })
      .find((button) => button.closest(".dropdown") === null);
    expect(quickBox).toHaveAttribute("aria-pressed", "true");
  });

  test("the open inspector overlays the canvas instead of reflowing it", () => {
    openReadyDocument();
    editorStore.setState({ selectedElementIds: ["t1"], inspectorOpen: true });
    render(<EditorPage />);

    const aside = screen.getByTestId("inspector-aside");
    // Out of the flex flow: opening/closing must not shift the canvas, or a
    // double click's target moves between the first and second click.
    expect(aside).toHaveClass("absolute", "right-0");
    expect(aside.className).not.toContain("shrink-0");
  });

  test("phone layout drops the sidebar for a top bar and the canvas", () => {
    breakpoint = "phone";
    openReadyDocument();
    render(<EditorPage />);

    // No permanent sidebar aside; the back action lives in the top bar instead.
    expect(screen.queryByTestId("inspector-aside")).toBeNull();
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to wireframes" }),
    ).toBeInTheDocument();
  });

  test("phone layout shows the Layers bottom sheet only when open", () => {
    breakpoint = "phone";
    openReadyDocument();
    const view = render(<EditorPage />);
    expect(screen.queryByRole("dialog", { name: "Layers" })).toBeNull();

    act(() => {
      editorStore.getState().openLayersPanel();
    });
    expect(screen.getByRole("dialog", { name: "Layers" })).toBeInTheDocument();
    view.unmount();
  });

  test("phone layout shows the inspector as a bottom sheet when one element is selected", () => {
    breakpoint = "phone";
    openReadyDocument();
    editorStore.setState({ selectedElementIds: ["t1"], inspectorOpen: true });
    render(<EditorPage />);

    expect(
      screen.getByRole("dialog", { name: "Element inspector" }),
    ).toBeInTheDocument();
  });

  test("tablet layout uses the icon rail and toggles the Layers overlay", () => {
    breakpoint = "tablet";
    openReadyDocument();
    render(<EditorPage />);

    // The rail replaces the sidebar; Layers overlay hidden until toggled.
    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("layers-aside")).toBeNull();

    act(() => {
      editorStore.getState().openLayersPanel();
    });
    expect(screen.getByTestId("layers-aside")).toBeInTheDocument();

    // The transparent backdrop over the canvas closes the overlay.
    const backdrop = screen
      .getAllByRole("button", { name: "Layers" })
      .find((button) => button.className.includes("inset-y-0"));
    fireEvent.click(backdrop!);
    expect(editorStore.getState().layersPanelOpen).toBe(false);
  });

  test("desktop enables auto-open of the inspector; phone/tablet disable it", () => {
    openReadyDocument();
    const view = render(<EditorPage />);
    expect(editorStore.getState().autoOpenInspector).toBe(true);
    view.unmount();

    breakpoint = "phone";
    const phone = render(<EditorPage />);
    expect(editorStore.getState().autoOpenInspector).toBe(false);
    phone.unmount();

    breakpoint = "tablet";
    render(<EditorPage />);
    expect(editorStore.getState().autoOpenInspector).toBe(false);
  });

  test("tablet layout overlays the inspector on the right when one element is selected", () => {
    breakpoint = "tablet";
    openReadyDocument();
    editorStore.setState({ selectedElementIds: ["t1"], inspectorOpen: true });
    render(<EditorPage />);

    expect(screen.getByTestId("inspector-aside")).toHaveClass(
      "absolute",
      "right-0",
    );
  });
});
