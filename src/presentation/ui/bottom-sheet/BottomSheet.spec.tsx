import { describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  test("renders nothing while closed", () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}} label="Layers">
        <p>body</p>
      </BottomSheet>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("body")).toBeNull();
  });

  test("owns the modal classes and merges layout className when open", () => {
    render(
      <BottomSheet open onClose={() => {}} label="Layers" className="p-0">
        <p>body</p>
      </BottomSheet>,
    );
    const dialog = screen.getByRole("dialog", { name: "Layers" });
    expect(dialog).toHaveClass("modal", "modal-open", "modal-bottom");
    const box = dialog.querySelector(".modal-box");
    expect(box).toHaveClass(
      "modal-box",
      "max-h-[60vh]",
      "overflow-y-auto",
      "p-0",
    );
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  test("closes on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} label="Layers">
        <p>body</p>
      </BottomSheet>,
    );
    fireEvent.click(document.querySelector(".modal-backdrop")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} label="Layers">
        <p>body</p>
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("ignores non-Escape keys", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} label="Layers">
        <p>body</p>
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
