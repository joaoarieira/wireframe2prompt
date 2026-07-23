import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ButtonEditOverlay } from "./ButtonEditOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { ButtonElement } from "../../../domain/entities/element/ButtonElement";

function makeButton(id: string, text: string): ButtonElement {
  return ButtonElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(8, 3),
    zIndex: 0,
    layerId: null,
    text,
  });
}

function openDocWithButton() {
  const button = makeButton("b1", "Text");
  editorStore.setState({
    document: WireframeDocument.create({
      id: "d",
      name: "d",
      gridSize: GridSize.create(20, 10),
      elements: [button],
    }),
    documentStatus: "ready",
    textEditingElementId: "b1",
    canvasEditingElementId: "b1",
    selectedElementIds: ["b1"],
  });
  return button;
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    textEditingElementId: null,
    canvasEditingElementId: null,
  });
});

describe("ButtonEditOverlay", () => {
  test("renders an input with the element's text", () => {
    const element = makeButton("b1", "Text");
    render(
      <ButtonEditOverlay
        element={element}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    expect(screen.getByTestId("button-edit-overlay")).toHaveValue("Text");
  });

  test("onChange updates element text via editElementProps", () => {
    openDocWithButton();
    const element = makeButton("b1", "Text");
    render(
      <ButtonEditOverlay
        element={element}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.change(screen.getByTestId("button-edit-overlay"), {
      target: { value: "Save" },
    });
    const updated = editorStore.getState().document?.getElement("b1");
    expect((updated as { text?: string }).text).toBe("Save");
  });

  test("Enter ends the editing session", () => {
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("button-edit-overlay"), {
      key: "Enter",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Escape ends the editing session", () => {
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("button-edit-overlay"), {
      key: "Escape",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Shift+Enter inserts a line break instead of ending", () => {
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("button-edit-overlay"), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("a non-terminating key does not end the session", () => {
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("button-edit-overlay"), { key: "a" });
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("blur ends the editing session (after timer flush)", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.blur(screen.getByTestId("button-edit-overlay"));
    vi.runAllTimers();
    vi.useRealTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("blur when overlay is unmounted before timer fires does not call onEnd", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.blur(screen.getByTestId("button-edit-overlay"));
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("blur when canvas div stole focus re-claims focus instead of ending", async () => {
    const onEnd = vi.fn();
    const canvasDiv = document.createElement("div");
    canvasDiv.setAttribute("data-testid", "canvas");
    canvasDiv.setAttribute("tabIndex", "0");
    const paperDiv = document.createElement("div");
    canvasDiv.appendChild(paperDiv);
    document.body.appendChild(canvasDiv);
    const ref = { current: paperDiv } as React.RefObject<HTMLElement | null>;

    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={onEnd}
        canvasRef={ref}
      />,
      { container: paperDiv },
    );
    canvasDiv.focus();
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(onEnd).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByTestId("button-edit-overlay"),
    );
    document.body.removeChild(canvasDiv);
  });

  test("Delete key inside input does not propagate to canvas", () => {
    const externalHandler = vi.fn();
    render(
      <div onKeyDown={externalHandler}>
        <ButtonEditOverlay
          element={makeButton("b1", "Text")}
          onEnd={vi.fn()}
          canvasRef={{ current: null }}
        />
      </div>,
    );
    fireEvent.keyDown(screen.getByTestId("button-edit-overlay"), {
      key: "Delete",
    });
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("pointer down inside the overlay does not propagate to the grid", () => {
    const externalHandler = vi.fn();
    render(
      <div onPointerDown={externalHandler}>
        <ButtonEditOverlay
          element={makeButton("b1", "Text")}
          onEnd={vi.fn()}
          canvasRef={{ current: null }}
        />
      </div>,
    );
    fireEvent.pointerDown(screen.getByTestId("button-edit-overlay"));
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("positioned over the centered label region using CSS custom properties", () => {
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    const input = screen.getByTestId("button-edit-overlay");
    // "Text" (4 wide) centered in the 8×3 button's 6-wide interior → starts col 2.
    expect(input.style.left).toBe("calc(var(--cell-w) * 2)");
    expect(input.style.top).toBe("calc(var(--cell-h) * 1)");
    expect(input.style.width).toBe("calc(var(--cell-w) * 4)");
  });

  test("typography matches the grid cells: mono advance stretched to --cell-w", () => {
    render(
      <ButtonEditOverlay
        element={makeButton("b1", "Text")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    const input = screen.getByTestId("button-edit-overlay");
    expect(input.style.letterSpacing).toBe("calc(var(--cell-w) - 1ch)");
    expect(input.style.paddingLeft).toBe("calc((var(--cell-w) - 1ch) / 2)");
    expect(input.style.lineHeight).toBe("var(--cell-h)");
    expect(input.style.whiteSpace).toBe("pre");
    expect(input).toHaveAttribute("wrap", "off");
  });
});
