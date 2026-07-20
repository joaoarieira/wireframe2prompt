import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  test("resizing: shows the preview size plus cancel and save actions", () => {
    openDoc();
    editorStore.setState({
      canvasResize: { previewSize: GridSize.create(30, 5), drag: null },
    });
    render(<CanvasResizeControl />);

    expect(screen.getByTestId("canvas-size-info")).toHaveTextContent("30x5");
    expect(
      screen.getByRole("button", { name: "Cancel canvas resize" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save canvas size" }),
    ).toBeInTheDocument();
  });

  test("cancel discards the preview without touching the grid", () => {
    openDoc();
    editorStore.setState({
      canvasResize: { previewSize: GridSize.create(30, 5), drag: null },
    });
    render(<CanvasResizeControl />);

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel canvas resize" }),
    );

    expect(editorStore.getState().canvasResize).toBeNull();
    expect(
      editorStore.getState().document!.gridSize.equals(GridSize.create(20, 10)),
    ).toBe(true);
  });

  test("save applies the previewed size to the document", () => {
    openDoc();
    editorStore.setState({
      canvasResize: { previewSize: GridSize.create(30, 5), drag: null },
    });
    render(<CanvasResizeControl />);

    fireEvent.click(screen.getByRole("button", { name: "Save canvas size" }));

    expect(editorStore.getState().canvasResize).toBeNull();
    expect(
      editorStore.getState().document!.gridSize.equals(GridSize.create(30, 5)),
    ).toBe(true);
  });
});
