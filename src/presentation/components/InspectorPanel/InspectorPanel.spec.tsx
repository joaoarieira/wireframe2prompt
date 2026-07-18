import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InspectorPanel } from "./InspectorPanel";
import { editorStore } from "../../state/app-store/appStore";
import { Position } from "../../../domain/entities/position/Position";
import type { TextElement } from "../../../domain/entities/element/TextElement";

async function openFreshDocumentWithText(): Promise<string> {
  const id = await editorStore
    .getState()
    .createDocument(`inspector-spec-${Math.random()}`);
  await editorStore.getState().openDocument(id);
  editorStore.getState().placeElement("text", Position.create(1, 1));
  const elementId = editorStore.getState().selectedElementId;
  if (elementId === null) {
    throw new Error("expected placeElement to select the new text element");
  }
  return elementId;
}

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
    expect(editorStore.getState().selectedElementId).toBeNull();
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
