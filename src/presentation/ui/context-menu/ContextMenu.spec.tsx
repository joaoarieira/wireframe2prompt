import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";

function renderMenu(onClose = vi.fn()) {
  return render(
    <ContextMenu x={100} y={200} onClose={onClose}>
      <ContextMenuItem>Copy</ContextMenuItem>
    </ContextMenu>,
  );
}

describe("ContextMenu", () => {
  test("renders with required daisyUI classes and fixed position", () => {
    renderMenu();
    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass(
      "menu",
      "rounded-box",
      "bg-base-100",
      "shadow-lg",
      "fixed",
    );
    expect(menu).toHaveStyle({ left: "100px", top: "200px" });
  });

  test("calls onClose when clicking outside the menu", () => {
    const onClose = vi.fn();
    renderMenu(onClose);
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("does NOT call onClose when clicking inside the menu", () => {
    const onClose = vi.fn();
    renderMenu(onClose);
    fireEvent.pointerDown(screen.getByRole("menu"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls onClose on Escape keydown, but not on other keys", () => {
    const onClose = vi.fn();
    renderMenu(onClose);
    fireEvent.keyDown(document, { key: "a" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("cleanup on unmount: events no longer fire onClose", () => {
    const onClose = vi.fn();
    const { unmount } = renderMenu(onClose);
    unmount();
    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ContextMenuItem", () => {
  test("renders a button inside a list item", () => {
    render(
      <ContextMenu x={0} y={0} onClose={vi.fn()}>
        <ContextMenuItem onClick={vi.fn()}>Copy</ContextMenuItem>
      </ContextMenu>,
    );
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  test("click runs the handler", () => {
    const onClick = vi.fn();
    render(
      <ContextMenu x={0} y={0} onClose={vi.fn()}>
        <ContextMenuItem onClick={onClick}>Copy</ContextMenuItem>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("shortcut renders de-emphasized and outside the accessible name", () => {
    render(
      <ContextMenu x={0} y={0} onClose={vi.fn()}>
        <ContextMenuItem shortcut="ctrl + c">Copy</ContextMenuItem>
      </ContextMenu>,
    );
    // aria-hidden keeps the name "Copy", not "Copy ctrl + c".
    const button = screen.getByRole("button", { name: "Copy" });
    const hint = screen.getByText("ctrl + c");
    expect(button).toContainElement(hint);
    expect(hint).toHaveClass("ml-auto", "text-xs", "opacity-50");
    expect(hint).toHaveAttribute("aria-hidden", "true");
  });

  test("disabled item has menu-disabled class and disabled attribute", () => {
    render(
      <ContextMenu x={0} y={0} onClose={vi.fn()}>
        <ContextMenuItem disabled>Paste</ContextMenuItem>
      </ContextMenu>,
    );
    const btn = screen.getByRole("button", { name: "Paste" });
    expect(btn).toHaveClass("menu-disabled");
    expect(btn).toBeDisabled();
  });
});
