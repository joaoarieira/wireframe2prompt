import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Dropdown, DropdownItem } from "./Dropdown";

describe("Dropdown", () => {
  test("renders a labelled ghost trigger and its menu options", () => {
    render(
      <Dropdown trigger={<span>▲</span>} triggerLabel="More tools">
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: "More tools" });
    expect(trigger).toHaveClass("btn", "btn-ghost", "btn-sm");
    expect(trigger).not.toHaveClass("btn-neutral");
    expect(screen.getByText("Box")).toBeInTheDocument();
  });

  test("active trigger swaps ghost for the neutral fill", () => {
    render(
      <Dropdown trigger="▲" triggerLabel="More tools" triggerActive>
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    expect(screen.getByRole("button", { name: "More tools" })).toHaveClass(
      "btn-neutral",
    );
  });

  test("merges className onto the trigger so it can join a group", () => {
    render(
      <Dropdown trigger="▲" triggerLabel="More tools" className="join-item">
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    expect(screen.getByRole("button", { name: "More tools" })).toHaveClass(
      "join-item",
    );
  });
});

describe("DropdownItem", () => {
  test("active option carries menu-active", () => {
    render(<DropdownItem active>Line</DropdownItem>);
    expect(screen.getByRole("button", { name: "Line" })).toHaveClass(
      "menu-active",
    );
  });

  test("click runs the handler then blurs to close the menu", () => {
    const onClick = vi.fn();
    render(<DropdownItem onClick={onClick}>Line</DropdownItem>);
    const item = screen.getByRole("button", { name: "Line" });
    item.focus();

    fireEvent.click(item);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(item).not.toHaveFocus();
  });

  test("click without a handler still closes without throwing", () => {
    render(<DropdownItem>Line</DropdownItem>);
    const item = screen.getByRole("button", { name: "Line" });
    item.focus();

    expect(() => fireEvent.click(item)).not.toThrow();
    expect(item).not.toHaveFocus();
  });
});
