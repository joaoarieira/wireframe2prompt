import { afterEach, describe, expect, test, vi } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DocumentRow } from "./DocumentRow";
import { editorStore } from "../../state/app-store/appStore";

// Only createLink (TextLink) touches the router here, mocked to a plain anchor
// so no RouterProvider is required (see DocumentListPage.spec).
vi.mock("@tanstack/react-router", () => ({
  createLink:
    (Anchor: (props: ComponentProps<"a">) => ReactNode) =>
    ({
      to,
      params: _params,
      ...rest
    }: { to?: string; params?: unknown } & ComponentProps<"a">) => (
      <Anchor href={to} {...rest} />
    ),
}));

const renameDocument = vi.fn(async () => {});
const deleteDocument = vi.fn(async () => {});

function renderRow(name = "Alpha", lastEdit = 0) {
  editorStore.setState({ renameDocument, deleteDocument });
  return render(
    <DocumentRow summary={{ id: "a", name, lastEdit }} nowMs={5 * 60_000} />,
  );
}

/** Opens the actions menu option with the given accessible name. */
function pickAction(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DocumentRow", () => {
  test("links the name to the editor and shows the relative edit time", () => {
    renderRow();

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "/editor/$documentId",
    );
    expect(screen.getByText("Edited 5m ago")).toBeInTheDocument();
  });

  test("the actions trigger only shows on row hover or focus", () => {
    renderRow();

    expect(
      screen.getByRole("button", { name: "Actions for Alpha" }),
    ).toHaveClass(
      "opacity-0",
      "group-hover:opacity-100",
      "group-focus-within:opacity-100",
      // touch has no hover, so there the trigger never hides
      "[@media(pointer:coarse)]:opacity-100",
    );
  });

  test("Delete removes the document", () => {
    renderRow();

    pickAction("Delete Alpha");

    expect(deleteDocument).toHaveBeenCalledWith("a");
  });

  test("Rename swaps the name for a focused field and commits on Enter", () => {
    renderRow();

    pickAction("Rename Alpha");
    const field = screen.getByRole("textbox", { name: "Rename Alpha" });
    expect(field).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Alpha" })).toBeNull();

    fireEvent.change(field, { target: { value: "  Beta  " } });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(renameDocument).toHaveBeenCalledWith("a", "Beta");
    // the field gives way to the link again once the rename is committed
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
  });

  test("Escape leaves the name untouched", () => {
    renderRow();

    pickAction("Rename Alpha");
    const field = screen.getByRole("textbox", { name: "Rename Alpha" });
    fireEvent.change(field, { target: { value: "Beta" } });
    fireEvent.keyDown(field, { key: "Escape" });

    expect(renameDocument).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
  });

  test("an unchanged or blank name is not persisted", () => {
    renderRow();

    pickAction("Rename Alpha");
    fireEvent.blur(screen.getByRole("textbox", { name: "Rename Alpha" }));
    expect(renameDocument).not.toHaveBeenCalled();

    pickAction("Rename Alpha");
    const field = screen.getByRole("textbox", { name: "Rename Alpha" });
    fireEvent.change(field, { target: { value: "   " } });
    fireEvent.blur(field);

    expect(renameDocument).not.toHaveBeenCalled();
  });
});
