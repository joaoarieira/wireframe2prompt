import { afterEach, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LayersPanel } from "./LayersPanel";
import { editorStore } from "../../state/app-store/appStore";
import { makeBox, makeDoc } from "../../../tests/fixtures";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import { BoxElement } from "../../../domain/entities/element/BoxElement";

function box(id: string, zIndex = 0): BoxElement {
  return BoxElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(4, 3),
    zIndex,
    layerId: null,
  });
}

afterEach(() => {
  cleanup();
  editorStore.setState({
    document: null,
    documentStatus: "idle",
    selectedElementIds: [],
    inspectorOpen: false,
  });
});

describe("LayersPanel", () => {
  test("renders nothing when there is no document", () => {
    const { container } = render(<LayersPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  test("shows empty message when document has no elements", () => {
    editorStore.setState({ document: makeDoc(), documentStatus: "ready" });
    render(<LayersPanel />);
    expect(screen.getByText("No elements yet.")).toBeInTheDocument();
  });

  test("lists elements topmost first", () => {
    editorStore.setState({
      document: makeDoc(box("low", 0), box("high", 5)),
      documentStatus: "ready",
    });
    render(<LayersPanel />);
    const rows = screen.getAllByRole("listitem");
    // topmost (z=5) comes first; elementKind.box translates to "box" (lowercase)
    expect(rows[0].textContent).toContain("z5");
    expect(rows[1].textContent).toContain("z0");
  });

  test("clicking a row selects the element and opens the inspector", () => {
    editorStore.setState({
      document: makeDoc(box("b1")),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("listitem"));

    expect(editorStore.getState().selectedElementIds).toEqual(["b1"]);
    expect(editorStore.getState().inspectorOpen).toBe(true);
  });

  test("shift+click toggles selection without opening the inspector", () => {
    editorStore.setState({
      document: makeDoc(box("b1")),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("listitem"), { shiftKey: true });

    expect(editorStore.getState().selectedElementIds).toContain("b1");
    expect(editorStore.getState().inspectorOpen).toBe(false);
  });

  test("shift+click on already-selected element deselects it", () => {
    editorStore.setState({
      document: makeDoc(box("b1")),
      documentStatus: "ready",
      selectedElementIds: ["b1"],
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("listitem"), { shiftKey: true });

    expect(editorStore.getState().selectedElementIds).not.toContain("b1");
  });

  test("selected row has highlighted background", () => {
    editorStore.setState({
      document: makeDoc(box("b1")),
      documentStatus: "ready",
      selectedElementIds: ["b1"],
    });
    render(<LayersPanel />);

    expect(screen.getByRole("listitem").className).toContain("bg-base-300");
  });

  test("bring forward button increments z-index", () => {
    editorStore.setState({
      document: makeDoc(box("b1", 2)),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("button", { name: /bring.*forward/i }));

    const el = editorStore.getState().document!.getElement("b1");
    expect(el?.zIndex).toBe(3);
  });

  test("send backward button decrements z-index", () => {
    editorStore.setState({
      document: makeDoc(box("b1", 2)),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("button", { name: /send.*backward/i }));

    const el = editorStore.getState().document!.getElement("b1");
    expect(el?.zIndex).toBe(1);
  });

  test("z-order buttons do not trigger row selection", () => {
    editorStore.setState({
      document: makeDoc(box("b1", 2)),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    fireEvent.click(screen.getByRole("button", { name: /bring.*forward/i }));

    expect(editorStore.getState().selectedElementIds).toEqual([]);
    expect(editorStore.getState().inspectorOpen).toBe(false);
  });

  test("shows user-given element name instead of kind", () => {
    const named = makeBox("b1").withProps({ name: "My Button" });
    editorStore.setState({
      document: makeDoc(named),
      documentStatus: "ready",
    });
    render(<LayersPanel />);

    expect(screen.getByRole("listitem")).toHaveTextContent("My Button");
  });
});
