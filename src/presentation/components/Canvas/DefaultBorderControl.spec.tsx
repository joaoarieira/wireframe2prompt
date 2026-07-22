import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DefaultBorderControl } from "./DefaultBorderControl";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    defaultBorderStyleName: "square",
    canvasResize: null,
  });
});

function openDoc() {
  editorStore.setState({
    document: makeDoc(makeBox("b1")),
    documentStatus: "ready",
    defaultBorderStyleName: "square",
  });
}

describe("DefaultBorderControl", () => {
  test("renders nothing when no document is open", () => {
    const { container } = render(<DefaultBorderControl />);
    expect(container).toBeEmptyDOMElement();
  });

  test("is omitted while the canvas-size editor is open", () => {
    openDoc();
    editorStore.setState({
      canvasResize: { previewSize: GridSize.create(30, 5), drag: null },
    });

    const { container } = render(<DefaultBorderControl />);

    expect(container).toBeEmptyDOMElement();
  });

  test("shows the trigger icon, header and the three style options", () => {
    openDoc();
    render(<DefaultBorderControl />);

    // The default (square) shows the Square icon on the trigger.
    const trigger = screen.getByRole("button", {
      name: "Default border",
    });
    expect(trigger.querySelector(".lucide-square")).not.toBeNull();
    expect(screen.getByText("Default border")).toHaveClass(
      "menu-title",
    );
    expect(screen.getByRole("button", { name: "Square" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rounded" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cross" })).toBeInTheDocument();
  });

  test("each option renders its lucide shape icon", () => {
    openDoc();
    render(<DefaultBorderControl />);

    expect(
      screen
        .getByRole("button", { name: "Rounded" })
        .querySelector(".lucide-square-round-corner"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Cross" })
        .querySelector(".lucide-frame"),
    ).not.toBeNull();
  });

  test("picking an option updates the editor's default border style", () => {
    openDoc();
    render(<DefaultBorderControl />);

    fireEvent.click(screen.getByRole("button", { name: "Rounded" }));

    expect(editorStore.getState().defaultBorderStyleName).toBe("rounded");
  });

  test("marks the active option and reflects it on the trigger", () => {
    editorStore.setState({
      document: makeDoc(makeBox("b1")),
      documentStatus: "ready",
      defaultBorderStyleName: "cross",
    });
    render(<DefaultBorderControl />);

    // Cross → the Frame icon on the trigger.
    expect(
      screen
        .getByRole("button", { name: "Default border" })
        .querySelector(".lucide-frame"),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Cross" })).toHaveClass(
      "menu-active",
    );
  });
});
