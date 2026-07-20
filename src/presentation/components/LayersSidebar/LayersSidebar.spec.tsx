import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { LayersSidebar } from "./LayersSidebar";
import { editorStore } from "../../state/app-store/appStore";
import { makeDoc } from "../../../tests/fixtures";

vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({ to, ...rest }: { to?: string } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

afterEach(() => {
  cleanup();
  editorStore.setState({ document: null, documentStatus: "idle" });
});

describe("LayersSidebar", () => {
  test("renders header, the layer list, and footer in order", () => {
    editorStore.setState({ document: makeDoc(), documentStatus: "ready" });
    render(<LayersSidebar />);

    // Header (back link), middle zone (empty layer list), footer (about link).
    const back = screen.getByRole("link", { name: "Back to wireframes" });
    const empty = screen.getByText("No elements yet.");
    const about = screen.getByRole("link", { name: "About" });

    expect(back).toBeInTheDocument();
    expect(empty).toBeInTheDocument();
    expect(about).toBeInTheDocument();

    // Document order: header before list before footer.
    const position = back.compareDocumentPosition(empty);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      empty.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
