import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TitleEditOverlay } from "./TitleEditOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { ModalElement } from "../../../domain/entities/element/ModalElement";

function makeCard(id: string, title: string | null): CardElement {
  return CardElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(12, 6),
    zIndex: 0,
    layerId: null,
    title,
  });
}

function openDocWithCard() {
  const card = makeCard("c1", "Card");
  editorStore.setState({
    document: WireframeDocument.create({
      id: "d",
      name: "d",
      gridSize: GridSize.create(20, 10),
      elements: [card],
    }),
    documentStatus: "ready",
    textEditingElementId: "c1",
    canvasEditingElementId: "c1",
    selectedElementIds: ["c1"],
  });
  return card;
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

describe("TitleEditOverlay", () => {
  test("renders an input with the element's title", () => {
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    expect(screen.getByTestId("title-edit-overlay")).toHaveValue("Card");
  });

  test("a null title edits as an empty box", () => {
    render(
      <TitleEditOverlay
        element={makeCard("c1", null)}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    expect(screen.getByTestId("title-edit-overlay")).toHaveValue("");
  });

  test("onChange updates the title via editElementProps", () => {
    openDocWithCard();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.change(screen.getByTestId("title-edit-overlay"), {
      target: { value: "Summary" },
    });
    const updated = editorStore.getState().document?.getElement("c1");
    expect((updated as CardElement).title).toBe("Summary");
  });

  test("clearing the box drops the title back to null", () => {
    openDocWithCard();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.change(screen.getByTestId("title-edit-overlay"), {
      target: { value: "" },
    });
    const updated = editorStore.getState().document?.getElement("c1");
    expect((updated as CardElement).title).toBeNull();
  });

  test("Enter ends the editing session", () => {
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("title-edit-overlay"), {
      key: "Enter",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Shift+Enter also ends: the title is single-line", () => {
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("title-edit-overlay"), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Escape ends the editing session", () => {
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("title-edit-overlay"), {
      key: "Escape",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("a non-terminating key does not end the session", () => {
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("title-edit-overlay"), { key: "a" });
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("blur ends the editing session (after timer flush)", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.blur(screen.getByTestId("title-edit-overlay"));
    vi.runAllTimers();
    vi.useRealTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("blur when overlay is unmounted before timer fires does not call onEnd", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={{ current: null }}
      />,
    );
    fireEvent.blur(screen.getByTestId("title-edit-overlay"));
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
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={onEnd}
        canvasRef={ref}
      />,
      { container: paperDiv },
    );
    canvasDiv.focus();
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(onEnd).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByTestId("title-edit-overlay"),
    );
    document.body.removeChild(canvasDiv);
  });

  test("Delete key inside input does not propagate to canvas", () => {
    const externalHandler = vi.fn();
    render(
      <div onKeyDown={externalHandler}>
        <TitleEditOverlay
          element={makeCard("c1", "Card")}
          onEnd={vi.fn()}
          canvasRef={{ current: null }}
        />
      </div>,
    );
    fireEvent.keyDown(screen.getByTestId("title-edit-overlay"), {
      key: "Delete",
    });
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("pointer down inside the overlay does not propagate to the grid", () => {
    const externalHandler = vi.fn();
    render(
      <div onPointerDown={externalHandler}>
        <TitleEditOverlay
          element={makeCard("c1", "Card")}
          onEnd={vi.fn()}
          canvasRef={{ current: null }}
        />
      </div>,
    );
    fireEvent.pointerDown(screen.getByTestId("title-edit-overlay"));
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("positioned over the card's title region using CSS custom properties", () => {
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    const input = screen.getByTestId("title-edit-overlay");
    // 12-wide card at (0,0): title starts at col 2 on row 1 and is 12-4 wide.
    expect(input.style.left).toBe("calc(var(--cell-w) * 2)");
    expect(input.style.top).toBe("calc(var(--cell-h) * 1)");
    expect(input.style.width).toBe("calc(var(--cell-w) * 8)");
    expect(input.style.height).toBe("calc(var(--cell-h) * 1)");
  });

  test("a modal's overlay stops before the close button", () => {
    const modal = ModalElement.create({
      id: "m1",
      position: Position.create(0, 0),
      size: Size.create(12, 6),
      zIndex: 0,
      layerId: null,
      title: "Modal",
    });
    render(
      <TitleEditOverlay
        element={modal}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    expect(screen.getByTestId("title-edit-overlay").style.width).toBe(
      "calc(var(--cell-w) * 6)",
    );
  });

  test("typography matches the grid cells: mono advance stretched to --cell-w", () => {
    render(
      <TitleEditOverlay
        element={makeCard("c1", "Card")}
        onEnd={vi.fn()}
        canvasRef={{ current: null }}
      />,
    );
    const input = screen.getByTestId("title-edit-overlay");
    expect(input.style.letterSpacing).toBe("calc(var(--cell-w) - 1ch)");
    expect(input.style.paddingLeft).toBe("calc((var(--cell-w) - 1ch) / 2)");
    expect(input.style.lineHeight).toBe("var(--cell-h)");
    expect(input.style.whiteSpace).toBe("pre");
    expect(input).toHaveAttribute("wrap", "off");
  });
});
