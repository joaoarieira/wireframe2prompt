import { afterEach, describe, expect, test } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { CanvasResizeControl } from "./CanvasResizeControl";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    canvasResize: null,
    canUndo: false,
  });
});

function openDoc() {
  editorStore.setState({
    document: makeDoc(makeBox("b1")),
    documentStatus: "ready",
    canvasResize: null,
  });
}

describe("CanvasResizeControl", () => {
  test("renders nothing when no document is open", () => {
    const { container } = render(<CanvasResizeControl />);
    expect(container).toBeEmptyDOMElement();
  });

  test("idle: shows a ghost button with the current grid size that opens the selector", () => {
    openDoc();
    render(<CanvasResizeControl />);

    // The 20×10 fixture grid renders as its raw dimensions.
    const button = screen.getByRole("button", { name: "Resize canvas" });
    expect(button).toHaveTextContent("20x10");

    fireEvent.click(button);

    expect(editorStore.getState().canvasResize).not.toBeNull();
  });

  function openResizing(size = GridSize.create(30, 5)) {
    openDoc();
    editorStore.setState({ canvasResize: { previewSize: size, drag: null } });
    render(<CanvasResizeControl />);
  }

  test("resizing: shows width/height inputs seeded from the preview plus cancel and save", () => {
    openResizing();

    expect(screen.getByLabelText("Canvas width in columns")).toHaveValue(30);
    expect(screen.getByLabelText("Canvas height in rows")).toHaveValue(5);
    expect(
      screen.getByRole("button", { name: "Cancel canvas resize" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save canvas size" }),
    ).toBeInTheDocument();
  });

  test("editing the width input previews the new size, keeping the height", () => {
    openResizing();

    fireEvent.change(screen.getByLabelText("Canvas width in columns"), {
      target: { value: "42" },
    });

    expect(
      editorStore
        .getState()
        .canvasResize!.previewSize.equals(GridSize.create(42, 5)),
    ).toBe(true);
  });

  test("editing the height input previews the new size, keeping the width", () => {
    openResizing();

    fireEvent.change(screen.getByLabelText("Canvas height in rows"), {
      target: { value: "9" },
    });

    expect(
      editorStore
        .getState()
        .canvasResize!.previewSize.equals(GridSize.create(30, 9)),
    ).toBe(true);
  });

  test("an empty or non-positive input is not published to the preview", () => {
    openResizing();
    const width = screen.getByLabelText("Canvas width in columns");

    // Field shows the raw text, but neither an empty nor a non-positive value
    // is published — the store keeps the last valid size.
    fireEvent.change(width, { target: { value: "" } });
    expect(width).toHaveValue(null);
    fireEvent.change(width, { target: { value: "0" } });
    expect(width).toHaveValue(0);

    expect(
      editorStore
        .getState()
        .canvasResize!.previewSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });

  test("an empty height input is not published to the preview", () => {
    openResizing();
    const height = screen.getByLabelText("Canvas height in rows");

    fireEvent.change(height, { target: { value: "" } });

    expect(height).toHaveValue(null);
    expect(
      editorStore
        .getState()
        .canvasResize!.previewSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });

  test("a handle drag updating the preview is mirrored back into the inputs", () => {
    openResizing();

    act(() => {
      editorStore.getState().setCanvasResizePreview(GridSize.create(12, 7));
    });

    expect(screen.getByLabelText("Canvas width in columns")).toHaveValue(12);
    expect(screen.getByLabelText("Canvas height in rows")).toHaveValue(7);
  });

  test("cancel discards the preview without touching the grid", () => {
    openResizing();

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel canvas resize" }),
    );

    expect(editorStore.getState().canvasResize).toBeNull();
    expect(
      editorStore.getState().document!.gridSize.equals(GridSize.create(20, 10)),
    ).toBe(true);
  });

  test("save applies the previewed size to the document", () => {
    openResizing();

    fireEvent.click(screen.getByRole("button", { name: "Save canvas size" }));

    expect(editorStore.getState().canvasResize).toBeNull();
    expect(
      editorStore.getState().document!.gridSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });
});
