import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { EditorPage } from "./EditorPage";
import { editorStore } from "../state/app-store/appStore";
import { makeDoc, makeText } from "../../tests/fixtures";

// The router Link needs a RouterProvider; here only ButtonLink touches the
// router, so createLink is mocked to a styled anchor (same as ButtonLink.spec).
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

function openReadyDocument() {
  editorStore.setState({
    document: makeDoc(makeText("t1", "hello")),
    documentStatus: "ready",
  });
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    inspectorOpen: false,
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

  test("ready state renders the canvas and the document name", () => {
    openReadyDocument();
    render(<EditorPage />);

    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.getByText("Untitled")).toBeInTheDocument();
    expect(screen.queryByTestId("inspector-aside")).toBeNull();
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
});
