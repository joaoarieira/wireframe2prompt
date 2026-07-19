import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TextEditOverlay } from "./TextEditOverlay";
import { editorStore } from "../../state/app-store/appStore";
import { makeDoc, makeText } from "../../../tests/fixtures";

function openDocWithText() {
  const textEl = makeText("t1", "hello");
  editorStore.setState({
    document: makeDoc(textEl),
    documentStatus: "ready",
    textEditingElementId: "t1",
    selectedElementIds: ["t1"],
  });
  return textEl;
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    textEditingElementId: null,
  });
});

describe("TextEditOverlay", () => {
  test("renders a textarea with the element's text", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);

    expect(screen.getByTestId("text-edit-overlay")).toHaveValue("hello");
  });

  test("onChange updates element text via editElementProps", () => {
    openDocWithText();
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.change(screen.getByTestId("text-edit-overlay"), {
      target: { value: "world" },
    });

    const updated = editorStore.getState().document?.getElement("t1");
    expect((updated as { text?: string }).text).toBe("world");
  });

  test("Enter ends the editing session", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.keyDown(screen.getByTestId("text-edit-overlay"), {
      key: "Enter",
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("Shift+Enter does not end the session (allows line break)", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.keyDown(screen.getByTestId("text-edit-overlay"), {
      key: "Enter",
      shiftKey: true,
    });

    expect(onEnd).not.toHaveBeenCalled();
  });

  test("Escape ends the editing session", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.keyDown(screen.getByTestId("text-edit-overlay"), {
      key: "Escape",
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("blur ends the editing session (after timer flush)", () => {
    vi.useFakeTimers();
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.blur(screen.getByTestId("text-edit-overlay"));
    vi.runAllTimers();
    vi.useRealTimers();

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  test("blur when overlay is unmounted before timer fires does not call onEnd", () => {
    vi.useFakeTimers();
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    fireEvent.blur(screen.getByTestId("text-edit-overlay"));
    // Unmount before the timer fires (simulates selectElement clearing canvasEditingElementId)
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(onEnd).not.toHaveBeenCalled();
  });

  test("blur when canvas div stole focus re-claims focus instead of ending", async () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();

    // Build a minimal DOM tree: canvas div > paper div (for canvasRef)
    const canvasDiv = document.createElement("div");
    canvasDiv.setAttribute("data-testid", "canvas");
    canvasDiv.setAttribute("tabIndex", "0");
    const paperDiv = document.createElement("div");
    canvasDiv.appendChild(paperDiv);
    document.body.appendChild(canvasDiv);

    const ref = { current: paperDiv } as React.RefObject<HTMLElement | null>;

    render(
      <TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />,
      { container: paperDiv },
    );
    // RTL's act() already flushed the useEffect; textarea now has focus.

    // Simulate the browser moving focus to the canvas div (mousedown on grid).
    // jsdom automatically fires a blur event on the textarea here.
    canvasDiv.focus();

    // Let the deferred handleBlur setTimeout run.
    await new Promise<void>((r) => setTimeout(r, 0));

    // onEnd must NOT have been called — canvas stole focus, textarea re-claimed it.
    expect(onEnd).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByTestId("text-edit-overlay"),
    );

    document.body.removeChild(canvasDiv);
  });

  test("Delete key inside textarea does not propagate to canvas", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };
    const externalHandler = vi.fn();

    const { container } = render(
      <div onKeyDown={externalHandler}>
        <TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />
      </div>,
    );
    fireEvent.keyDown(screen.getByTestId("text-edit-overlay"), {
      key: "Delete",
    });

    expect(externalHandler).not.toHaveBeenCalled();
    void container;
  });

  test("pointer down inside the overlay does not propagate to the grid", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };
    const externalHandler = vi.fn();

    render(
      <div onPointerDown={externalHandler}>
        <TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />
      </div>,
    );
    fireEvent.pointerDown(screen.getByTestId("text-edit-overlay"));

    expect(externalHandler).not.toHaveBeenCalled();
  });

  test("positioned by element bounds using CSS custom properties", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    const ta = screen.getByTestId("text-edit-overlay");

    expect(ta.style.left).toBe("calc(var(--cell-w) * 0)");
    expect(ta.style.top).toBe("calc(var(--cell-h) * 0)");
  });

  test("typography matches the grid cells: mono advance stretched to --cell-w", () => {
    const element = makeText("t1", "hello");
    const onEnd = vi.fn();
    const ref = { current: null };

    render(<TextEditOverlay element={element} onEnd={onEnd} canvasRef={ref} />);
    const ta = screen.getByTestId("text-edit-overlay");

    expect(ta.style.letterSpacing).toBe("calc(var(--cell-w) - 1ch)");
    expect(ta.style.paddingLeft).toBe("calc((var(--cell-w) - 1ch) / 2)");
    expect(ta.style.lineHeight).toBe("var(--cell-h)");
    expect(ta.style.whiteSpace).toBe("pre");
    expect(ta).toHaveAttribute("wrap", "off");
  });
});
