import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { EditorContextMenu } from "./EditorContextMenu";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(3, 3);

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    contextMenu: null,
    clipboard: [],
    selectedElementIds: [],
    pastePreview: null,
  });
});

function openWithMenu(
  opts: { selectedIds?: string[]; hasClipboard?: boolean } = {},
) {
  const box = makeBox("b1");
  editorStore.setState({
    document: makeDoc(box),
    contextMenu: { clientX: 100, clientY: 200, cell, target: "element" },
    selectedElementIds: opts.selectedIds ?? ["b1"],
    clipboard: opts.hasClipboard ? [box] : [],
  });
  render(<EditorContextMenu />);
}

describe("EditorContextMenu", () => {
  test("renders null when contextMenu is null", () => {
    editorStore.setState({ contextMenu: null });
    render(<EditorContextMenu />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  test("renders all four items when context menu is open", () => {
    openWithMenu();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paste" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Duplicate" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  test("empty-area menu shows only Paste", () => {
    const box = makeBox("b1");
    editorStore.setState({
      document: makeDoc(box),
      contextMenu: { clientX: 100, clientY: 200, cell, target: "empty" },
      selectedElementIds: ["b1"],
      clipboard: [box],
    });
    render(<EditorContextMenu />);

    expect(screen.getByRole("button", { name: "Paste" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Duplicate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  test("empty-area Paste opens the preview anchored at the clicked cell", () => {
    editorStore.setState({
      document: makeDoc(),
      contextMenu: { clientX: 100, clientY: 200, cell, target: "empty" },
      selectedElementIds: [],
      clipboard: [makeBox("b1")],
    });
    render(<EditorContextMenu />);

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));

    expect(editorStore.getState().pastePreview?.anchorCell).toEqual(cell);
    expect(editorStore.getState().contextMenu).toBeNull();
  });

  test("Paste is disabled when clipboard is empty", () => {
    openWithMenu({ hasClipboard: false });
    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
  });

  test("Copy, Duplicate, Delete are disabled when selection is empty", () => {
    openWithMenu({ selectedIds: [] });
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  test("Copy fills the clipboard and closes the menu", () => {
    openWithMenu({ selectedIds: ["b1"] });
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(editorStore.getState().clipboard).toHaveLength(1);
    expect(editorStore.getState().contextMenu).toBeNull();
  });

  test("Paste button click opens paste preview with the context menu cell", () => {
    const box = makeBox("b1");
    editorStore.setState({
      document: makeDoc(box),
      contextMenu: { clientX: 100, clientY: 200, cell, target: "element" },
      selectedElementIds: ["b1"],
      clipboard: [box],
    });
    render(<EditorContextMenu />);

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));

    expect(editorStore.getState().pastePreview).not.toBeNull();
    expect(editorStore.getState().pastePreview?.anchorCell).toEqual(cell);
    expect(editorStore.getState().contextMenu).toBeNull();
  });

  test("Delete removes selected elements and closes the menu", () => {
    openWithMenu({ selectedIds: ["b1"] });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(editorStore.getState().document?.elements).toHaveLength(0);
    expect(editorStore.getState().contextMenu).toBeNull();
  });

  test("menu closes after Duplicate action", () => {
    openWithMenu({ selectedIds: ["b1"] });
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(editorStore.getState().contextMenu).toBeNull();
  });
});
