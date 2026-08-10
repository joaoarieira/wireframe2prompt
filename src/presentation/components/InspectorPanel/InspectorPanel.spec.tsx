import { describe, expect, test } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InspectorPanel } from "./InspectorPanel";
import { editorStore } from "../../state/app-store/appStore";
import { Position } from "../../../domain/entities/position/Position";
import type { Element } from "../../../domain/entities/element/Element";
import type { TextElement } from "../../../domain/entities/element/TextElement";
import type { LineElement } from "../../../domain/entities/element/LineElement";
import type { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import type { CardElement } from "../../../domain/entities/element/CardElement";
import type { ModalElement } from "../../../domain/entities/element/ModalElement";
import type { TableElement } from "../../../domain/entities/element/TableElement";
import type { TabsElement } from "../../../domain/entities/element/TabsElement";
import type { FieldElement } from "../../../domain/entities/element/FieldElement";
import type { ButtonElement } from "../../../domain/entities/element/ButtonElement";
import type { BoxElement } from "../../../domain/entities/element/BoxElement";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";
import type { PlaceableKind } from "../../state/element-factory/elementFactory";

async function openFreshDocumentWith(kind: PlaceableKind): Promise<string> {
  const id = await editorStore
    .getState()
    .createDocument(`inspector-spec-${Math.random()}`);
  await editorStore.getState().openDocument(id);
  editorStore.getState().placeElement(kind, Position.create(1, 1));
  const elementId = editorStore.getState().selectedElementIds[0];
  if (elementId === undefined) {
    throw new Error(`expected placeElement to select the new ${kind} element`);
  }
  return elementId;
}

const openFreshDocumentWithText = () => openFreshDocumentWith("text");

function selectedElement<T extends Element>(elementId: string): T {
  const element = editorStore.getState().document?.getElement(elementId);
  if (element === undefined) {
    throw new Error(`expected element "${elementId}" to exist`);
  }
  return element as T;
}

/** The spinbutton inside the fieldset captioned by the given legend. */
function numberFieldIn(legend: string): HTMLElement {
  return within(screen.getByRole("group", { name: legend })).getByRole(
    "spinbutton",
  );
}

describe("InspectorPanel button editing", () => {
  test("shows the label editor and updates the button text", async () => {
    const elementId = await openFreshDocumentWith("button");
    render(<InspectorPanel />);

    const input = screen.getByLabelText("Text content");
    expect(input).toHaveValue("Text");

    fireEvent.change(input, { target: { value: "Save" } });
    expect(selectedElement<ButtonElement>(elementId).text).toBe("Save");
  });

  test("focusing the label editor starts the text-editing session", async () => {
    await openFreshDocumentWith("button");
    render(<InspectorPanel />);
    const input = screen.getByLabelText("Text content");

    fireEvent.focus(input);
    expect(editorStore.getState().textEditingElementId).not.toBeNull();

    fireEvent.blur(input);
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });
});

describe("InspectorPanel text editing", () => {
  test("no field steals the focus when the panel opens", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);

    expect(screen.getByLabelText("Text content")).not.toHaveFocus();
    expect(screen.getByLabelText("Element name")).not.toHaveFocus();
  });

  test("focusing the name field does not move the focus to the text field", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);
    const nameInput = screen.getByLabelText("Element name");

    nameInput.focus();

    expect(nameInput).toHaveFocus();
    expect(screen.getByLabelText("Text content")).not.toHaveFocus();
  });

  test("typing multi-line content updates the element and auto-fits its size", async () => {
    const elementId = await openFreshDocumentWithText();
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("Text content"), {
      target: { value: "ab\ncdef" },
    });

    const element = editorStore
      .getState()
      .document?.getElement(elementId) as TextElement;
    expect(element.text).toBe("ab\ncdef");
    expect(element.size.width).toBe(4);
    expect(element.size.height).toBe(2);
  });

  test("Enter ends the editing session; Shift+Enter does not", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);
    const textarea = screen.getByLabelText("Text content");

    fireEvent.focus(textarea); // typing starts the editing session
    expect(editorStore.getState().textEditingElementId).not.toBeNull();

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(editorStore.getState().textEditingElementId).not.toBeNull();

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test("Delete removes the selected element from the document", async () => {
    const elementId = await openFreshDocumentWithText();
    render(<InspectorPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      editorStore.getState().document?.getElement(elementId),
    ).toBeUndefined();
    expect(editorStore.getState().selectedElementIds).toEqual([]);
  });

  test("the ✕ button closes the inspector", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);
    expect(editorStore.getState().inspectorOpen).toBe(true);

    fireEvent.click(screen.getByLabelText("Close inspector"));

    expect(editorStore.getState().inspectorOpen).toBe(false);
  });

  test("the name field renames the element (empty clears the name)", async () => {
    const elementId = await openFreshDocumentWithText();
    render(<InspectorPanel />);
    const nameInput = screen.getByLabelText("Element name");

    fireEvent.change(nameInput, { target: { value: "Custom name" } });
    expect(editorStore.getState().document?.getElement(elementId)?.name).toBe(
      "Custom name",
    );

    fireEvent.change(nameInput, { target: { value: "" } });
    expect(
      editorStore.getState().document?.getElement(elementId)?.name,
    ).toBeNull();
  });

  test("the text edit hint is shown below the text content field", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);

    expect(
      screen.getByText(
        "Double-click the element on the canvas to edit its text.",
      ),
    ).toBeInTheDocument();
  });
});

describe("InspectorPanel tabs editing", () => {
  test("a trailing Shift+Enter line break survives while the field is focused", async () => {
    const elementId = await openFreshDocumentWith("tabs");
    render(<InspectorPanel />);
    const textarea = screen.getByLabelText("One tab per line");

    fireEvent.focus(textarea);
    // Typing a line break after the last tab: the committed tabs drop the
    // blank line, but the textarea must keep it so the next tab can be typed.
    fireEvent.change(textarea, { target: { value: "Tab 1\nTab 2\n" } });

    expect(textarea).toHaveValue("Tab 1\nTab 2\n");
    const element = editorStore
      .getState()
      .document?.getElement(elementId) as TabsElement;
    expect(element.tabs).toEqual(["Tab 1", "Tab 2"]);
  });

  test("blur snaps the field back to the committed tabs", async () => {
    await openFreshDocumentWith("tabs");
    render(<InspectorPanel />);
    const textarea = screen.getByLabelText("One tab per line");

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: "Tab 1\n" } });
    fireEvent.blur(textarea);

    expect(textarea).toHaveValue("Tab 1");
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test("clearing the field keeps the last valid tabs on the element", async () => {
    const elementId = await openFreshDocumentWith("tabs");
    render(<InspectorPanel />);
    const textarea = screen.getByLabelText("One tab per line");

    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: "" } });

    expect(textarea).toHaveValue(""); // the user can start over from empty
    const element = editorStore
      .getState()
      .document?.getElement(elementId) as TabsElement;
    expect(element.tabs).toEqual(["Tab 1", "Tab 2"]); // default tabs untouched
  });

  test("the active tab select switches the active tab", async () => {
    const elementId = await openFreshDocumentWith("tabs");
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("Active tab"), {
      target: { value: "1" },
    });

    expect(selectedElement<TabsElement>(elementId).active).toBe(1);
  });
});

describe("InspectorPanel geometry fields", () => {
  test("renders nothing when no element is selected", async () => {
    await openFreshDocumentWithText();
    editorStore.getState().selectElement(null);

    const { container } = render(<InspectorPanel />);

    expect(container.firstChild).toBeNull();
  });

  test("col/row fields move the element; a non-integer value is ignored", async () => {
    const elementId = await openFreshDocumentWithText();
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("col"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("row"), { target: { value: "5" } });
    expect(
      selectedElement(elementId).position.equals(Position.create(7, 5)),
    ).toBe(true);

    fireEvent.change(screen.getByLabelText("col"), {
      target: { value: "2.5" },
    });
    fireEvent.change(screen.getByLabelText("row"), {
      target: { value: "2.5" },
    });
    expect(
      selectedElement(elementId).position.equals(Position.create(7, 5)),
    ).toBe(true);
  });

  test("w/h fields resize the element; zero and non-integer values are ignored", async () => {
    const elementId = await openFreshDocumentWith("box");
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("w"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("h"), { target: { value: "6" } });
    expect(selectedElement(elementId).size.width).toBe(10);
    expect(selectedElement(elementId).size.height).toBe(6);

    fireEvent.change(screen.getByLabelText("w"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("h"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("w"), { target: { value: "2.5" } });
    fireEvent.change(screen.getByLabelText("h"), { target: { value: "2.5" } });
    expect(selectedElement(elementId).size.width).toBe(10);
    expect(selectedElement(elementId).size.height).toBe(6);
  });

  test("the size field is hidden for a free-draw element", async () => {
    await openFreshDocumentWithText();
    editorStore.getState().beginDrawStroke(Position.create(2, 2));
    editorStore.getState().commitStroke(); // creates + selects a free-draw
    render(<InspectorPanel />);

    expect(screen.queryByLabelText("w")).toBeNull();
    expect(screen.queryByLabelText("h")).toBeNull();
  });

  test("focusing the name field holds the text-editing session until blur", async () => {
    const elementId = await openFreshDocumentWithText();
    render(<InspectorPanel />);
    const nameInput = screen.getByLabelText("Element name");

    fireEvent.focus(nameInput);
    expect(editorStore.getState().textEditingElementId).toBe(elementId);

    fireEvent.blur(nameInput);
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });
});

describe("InspectorPanel kind-specific fields", () => {
  test("the orientation select flips a line to vertical", async () => {
    const elementId = await openFreshDocumentWith("line");
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("Line orientation"), {
      target: { value: "v" },
    });

    expect(selectedElement<LineElement>(elementId).orientation).toBe("v");
  });

  test("the direction select points an arrow up", async () => {
    const elementId = await openFreshDocumentWith("arrow");
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("Arrow direction"), {
      target: { value: "up" },
    });

    expect(selectedElement<ArrowElement>(elementId).direction).toBe("up");
  });

  test("the card title field edits the title and empty clears it", async () => {
    const elementId = await openFreshDocumentWith("card");
    render(<InspectorPanel />);
    const titleInput = screen.getByLabelText("Title text");

    fireEvent.focus(titleInput);
    expect(editorStore.getState().textEditingElementId).toBe(elementId);

    fireEvent.change(titleInput, { target: { value: "Pricing" } });
    expect(selectedElement<CardElement>(elementId).title).toBe("Pricing");

    fireEvent.change(titleInput, { target: { value: "" } });
    expect(selectedElement<CardElement>(elementId).title).toBeNull();

    fireEvent.blur(titleInput);
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test.each(["card", "modal"] as const)(
    "the %s title field points at the on-canvas editor",
    async (kind) => {
      await openFreshDocumentWith(kind);
      render(<InspectorPanel />);

      expect(
        screen.getByText("Double-click the title on the canvas to edit it."),
      ).toBeInTheDocument();
    },
  );

  test("the modal title field edits the title and empty clears it", async () => {
    const elementId = await openFreshDocumentWith("modal");
    render(<InspectorPanel />);
    const titleInput = screen.getByLabelText("Title text");

    fireEvent.focus(titleInput);
    expect(editorStore.getState().textEditingElementId).toBe(elementId);

    fireEvent.change(titleInput, { target: { value: "Confirm" } });
    expect(selectedElement<ModalElement>(elementId).title).toBe("Confirm");

    fireEvent.change(titleInput, { target: { value: "" } });
    expect(selectedElement<ModalElement>(elementId).title).toBeNull();

    fireEvent.blur(titleInput);
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test("table columns/rows fields reshape the table; invalid values are ignored", async () => {
    const elementId = await openFreshDocumentWith("table");
    render(<InspectorPanel />);

    fireEvent.change(numberFieldIn("Columns"), { target: { value: "4" } });
    fireEvent.change(numberFieldIn("Rows"), { target: { value: "3" } });
    expect(selectedElement<TableElement>(elementId).columns).toBe(4);
    expect(selectedElement<TableElement>(elementId).rows).toBe(3);

    fireEvent.change(numberFieldIn("Columns"), { target: { value: "0" } });
    fireEvent.change(numberFieldIn("Rows"), { target: { value: "0" } });
    fireEvent.change(numberFieldIn("Columns"), { target: { value: "2.5" } });
    fireEvent.change(numberFieldIn("Rows"), { target: { value: "2.5" } });
    expect(selectedElement<TableElement>(elementId).columns).toBe(4);
    expect(selectedElement<TableElement>(elementId).rows).toBe(3);
  });

  test("the input slot fields edit label, placeholder and hint; empty clears them", async () => {
    const elementId = await openFreshDocumentWith("input");
    render(<InspectorPanel />);
    const labelInput = screen.getByLabelText("Label text");
    const placeholderInput = screen.getByLabelText("Placeholder text");
    const hintInput = screen.getByLabelText("Hint text");

    fireEvent.focus(labelInput);
    expect(editorStore.getState().textEditingElementId).toBe(elementId);

    fireEvent.change(labelInput, { target: { value: "Email" } });
    expect(selectedElement<FieldElement>(elementId).label).toBe("Email");
    fireEvent.change(labelInput, { target: { value: "" } });
    expect(selectedElement<FieldElement>(elementId).label).toBeNull();

    fireEvent.change(placeholderInput, { target: { value: "you@x.com" } });
    expect(selectedElement<FieldElement>(elementId).placeholder).toBe(
      "you@x.com",
    );
    fireEvent.change(placeholderInput, { target: { value: "" } });
    expect(selectedElement<FieldElement>(elementId).placeholder).toBeNull();

    fireEvent.focus(hintInput);
    expect(editorStore.getState().textEditingElementId).toBe(elementId);
    fireEvent.change(hintInput, { target: { value: "Required" } });
    expect(selectedElement<FieldElement>(elementId).hint).toBe("Required");
    fireEvent.change(hintInput, { target: { value: "" } });
    expect(selectedElement<FieldElement>(elementId).hint).toBeNull();

    fireEvent.blur(hintInput);
    expect(editorStore.getState().textEditingElementId).toBeNull();
  });

  test("the dropdown exposes the same slot fields", async () => {
    const elementId = await openFreshDocumentWith("dropdown");
    render(<InspectorPanel />);

    fireEvent.change(screen.getByLabelText("Label text"), {
      target: { value: "Country" },
    });
    expect(selectedElement<FieldElement>(elementId).label).toBe("Country");
  });
});

describe("InspectorPanel border style", () => {
  test("a bordered element exposes a picker that edits its border style", async () => {
    const elementId = await openFreshDocumentWith("box");
    render(<InspectorPanel />);

    const select = screen.getByLabelText("Element border style");
    expect((select as HTMLSelectElement).value).toBe("square");

    fireEvent.change(select, { target: { value: "rounded" } });

    expect(
      selectedElement<BoxElement>(elementId).borderStyle.equals(
        BorderStyle.rounded(),
      ),
    ).toBe(true);
  });

  test("the picker reflects the element's current style", async () => {
    const elementId = await openFreshDocumentWith("card");
    editorStore
      .getState()
      .editElementProps(elementId, { borderStyle: BorderStyle.cross() });
    render(<InspectorPanel />);

    expect(
      (screen.getByLabelText("Element border style") as HTMLSelectElement)
        .value,
    ).toBe("cross");
  });

  test("a borderless element has no border-style picker", async () => {
    await openFreshDocumentWithText();
    render(<InspectorPanel />);

    expect(screen.queryByLabelText("Element border style")).toBeNull();
  });

  test("the picker falls back to square for a custom, unnamed style", async () => {
    const elementId = await openFreshDocumentWith("box");
    const custom = BorderStyle.create({
      topLeft: "#",
      topRight: "#",
      bottomLeft: "#",
      bottomRight: "#",
      horizontal: "=",
      vertical: "#",
      teeRight: "#",
      teeLeft: "#",
      teeDown: "#",
      teeUp: "#",
      cross: "#",
    });
    editorStore.getState().editElementProps(elementId, { borderStyle: custom });
    render(<InspectorPanel />);

    expect(
      (screen.getByLabelText("Element border style") as HTMLSelectElement)
        .value,
    ).toBe("square");
  });
});
