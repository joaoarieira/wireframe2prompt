import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DocumentRenameInput } from "./DocumentRenameInput";

const onCommit = vi.fn();
const onCancel = vi.fn();

function renderField() {
  render(
    <DocumentRenameInput
      name="Alpha"
      label="Rename Alpha"
      onCommit={onCommit}
      onCancel={onCancel}
    />,
  );
  return screen.getByRole("textbox", { name: "Rename Alpha" });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DocumentRenameInput", () => {
  test("mounts focused with the current name selected", () => {
    const field = renderField() as HTMLInputElement;

    expect(field).toHaveFocus();
    expect(field.value).toBe("Alpha");
    expect(field.selectionStart).toBe(0);
    expect(field.selectionEnd).toBe("Alpha".length);
  });

  test("Enter commits the typed draft", () => {
    const field = renderField();

    fireEvent.change(field, { target: { value: "Beta" } });
    fireEvent.keyDown(field, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledWith("Beta");
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("blur commits the typed draft", () => {
    const field = renderField();

    fireEvent.change(field, { target: { value: "Beta" } });
    fireEvent.blur(field);

    expect(onCommit).toHaveBeenCalledWith("Beta");
  });

  test("other keys keep editing", () => {
    const field = renderField();

    fireEvent.keyDown(field, { key: "a" });

    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("Escape cancels, and the blur it triggers does not also commit", () => {
    const field = renderField();

    fireEvent.change(field, { target: { value: "Beta" } });
    fireEvent.keyDown(field, { key: "Escape" });
    fireEvent.blur(field);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  test("a second confirm after committing is ignored", () => {
    const field = renderField();

    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.blur(field);

    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
