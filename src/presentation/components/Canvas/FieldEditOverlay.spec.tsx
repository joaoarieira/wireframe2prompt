import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";
import { FieldEditOverlay } from "./FieldEditOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { InputElement } from "../../../domain/entities/element/InputElement";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { makeDoc } from "../../../tests/fixtures";

function makeInput() {
  return InputElement.create({
    id: "in1",
    position: Position.create(0, 0),
    size: Size.create(22, 4),
    zIndex: 0,
    layerId: null,
    label: "Label",
    placeholder: "Placeholder",
    hint: "Hint",
  });
}

const nullRef = { current: null } as RefObject<HTMLElement | null>;

function openDoc(element: InputElement) {
  editorStore.setState({
    document: makeDoc(element),
    documentStatus: "ready",
    selectedElementIds: ["in1"],
    textEditingElementId: "in1",
    canvasEditingElementId: "in1",
  });
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    textEditingElementId: null,
    canvasEditingElementId: null,
    canvasEditingField: null,
  });
});

describe("FieldEditOverlay", () => {
  test.each([
    ["label", "Label"],
    ["placeholder", "Placeholder"],
    ["hint", "Hint"],
  ] as const)("shows the %s slot's current value", (field, value) => {
    render(
      <FieldEditOverlay
        element={makeInput()}
        field={field}
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    expect(screen.getByTestId("field-edit-overlay")).toHaveValue(value);
  });

  test("a null slot renders as an empty textarea", () => {
    const element = InputElement.create({
      id: "in1",
      position: Position.create(0, 0),
      size: Size.create(22, 4),
      zIndex: 0,
      layerId: null,
      label: null,
      placeholder: null,
      hint: null,
    });
    render(
      <FieldEditOverlay
        element={element}
        field="label"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    expect(screen.getByTestId("field-edit-overlay")).toHaveValue("");
  });

  test("onChange writes the slot back through editElementProps", () => {
    openDoc(makeInput());

    render(
      <FieldEditOverlay
        element={makeInput()}
        field="label"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    fireEvent.change(screen.getByTestId("field-edit-overlay"), {
      target: { value: "Email" },
    });

    const updated = editorStore.getState().document?.getElement("in1");
    expect((updated as InputElement).label).toBe("Email");
  });

  test("clearing the slot stores null", () => {
    openDoc(makeInput());

    render(
      <FieldEditOverlay
        element={makeInput()}
        field="hint"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    fireEvent.change(screen.getByTestId("field-edit-overlay"), {
      target: { value: "" },
    });

    const updated = editorStore.getState().document?.getElement("in1");
    expect((updated as InputElement).hint).toBeNull();
  });

  test("Enter ends editing for a single-line slot", () => {
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="label"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("field-edit-overlay"), {
      key: "Enter",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Shift+Enter inserts a newline in the hint (does not end)", () => {
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="hint"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("field-edit-overlay"), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("plain Enter ends editing for the hint", () => {
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="hint"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("field-edit-overlay"), {
      key: "Enter",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Escape ends editing", () => {
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="placeholder"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.keyDown(screen.getByTestId("field-edit-overlay"), {
      key: "Escape",
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("an unrelated key neither ends editing nor propagates", () => {
    const onEnd = vi.fn();
    const externalHandler = vi.fn();
    render(
      <div onKeyDown={externalHandler}>
        <FieldEditOverlay
          element={makeInput()}
          field="label"
          onEnd={onEnd}
          canvasRef={nullRef}
        />
      </div>,
    );
    fireEvent.keyDown(screen.getByTestId("field-edit-overlay"), {
      key: "a",
    });
    expect(onEnd).not.toHaveBeenCalled();
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("blur ends editing after the deferred check", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="label"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.blur(screen.getByTestId("field-edit-overlay"));
    vi.runAllTimers();
    vi.useRealTimers();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("blur after unmount does not end editing", () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="label"
        onEnd={onEnd}
        canvasRef={nullRef}
      />,
    );
    fireEvent.blur(screen.getByTestId("field-edit-overlay"));
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
    expect(onEnd).not.toHaveBeenCalled();
  });

  test("blur re-claims focus when the canvas stole it", async () => {
    const onEnd = vi.fn();
    const canvasDiv = document.createElement("div");
    canvasDiv.setAttribute("data-testid", "canvas");
    canvasDiv.setAttribute("tabIndex", "0");
    const paperDiv = document.createElement("div");
    canvasDiv.appendChild(paperDiv);
    document.body.appendChild(canvasDiv);
    const ref = { current: paperDiv } as RefObject<HTMLElement | null>;

    render(
      <FieldEditOverlay
        element={makeInput()}
        field="label"
        onEnd={onEnd}
        canvasRef={ref}
      />,
      { container: paperDiv },
    );
    canvasDiv.focus();
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(onEnd).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByTestId("field-edit-overlay"),
    );
    document.body.removeChild(canvasDiv);
  });

  test("pointer down does not propagate to the grid", () => {
    const externalHandler = vi.fn();
    render(
      <div onPointerDown={externalHandler}>
        <FieldEditOverlay
          element={makeInput()}
          field="label"
          onEnd={vi.fn()}
          canvasRef={nullRef}
        />
      </div>,
    );
    fireEvent.pointerDown(screen.getByTestId("field-edit-overlay"));
    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("hint wraps; label/placeholder do not", () => {
    const { rerender } = render(
      <FieldEditOverlay
        element={makeInput()}
        field="hint"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    const hint = screen.getByTestId("field-edit-overlay");
    expect(hint.style.whiteSpace).toBe("pre-wrap");
    expect(hint).toHaveAttribute("wrap", "soft");

    rerender(
      <FieldEditOverlay
        element={makeInput()}
        field="placeholder"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    const placeholder = screen.getByTestId("field-edit-overlay");
    expect(placeholder.style.whiteSpace).toBe("pre");
    expect(placeholder).toHaveAttribute("wrap", "off");
  });

  test("positions the overlay over the placeholder region", () => {
    render(
      <FieldEditOverlay
        element={makeInput()}
        field="placeholder"
        onEnd={vi.fn()}
        canvasRef={nullRef}
      />,
    );
    const ta = screen.getByTestId("field-edit-overlay");
    // placeholderRegion of a 22-wide input: col 2, row 1.
    expect(ta.style.left).toBe("calc(var(--cell-w) * 2)");
    expect(ta.style.top).toBe("calc(var(--cell-h) * 1)");
  });
});
