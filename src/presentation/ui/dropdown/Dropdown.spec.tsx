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
    // Scroll containers (the footer's tool strip) key off this marker to lift
    // their overflow clip only while a dropdown menu is open.
    expect(trigger.closest("[data-ui-dropdown]")).not.toBeNull();
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

  test("renders an optional menu-title header above the options", () => {
    render(
      <Dropdown trigger="▲" triggerLabel="Border" menuLabel="Default border">
        <DropdownItem>Square</DropdownItem>
      </Dropdown>,
    );

    expect(screen.getByText("Default border")).toHaveClass("menu-title");
  });

  test("compact trigger defers the tap-target floor to lg screens", () => {
    render(
      <Dropdown trigger="▲" triggerLabel="More tools" triggerCompact>
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: "More tools" });
    expect(trigger).toHaveClass("lg:[@media(pointer:coarse)]:min-h-11");
    expect(trigger).not.toHaveClass("[@media(pointer:coarse)]:min-h-11");
  });

  test("defaults to opening upward", () => {
    const { container } = render(
      <Dropdown trigger="▲" triggerLabel="More tools">
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    const root = container.querySelector("[data-ui-dropdown]");
    expect(root).toHaveClass("dropdown-top");
    expect(root).not.toHaveClass("dropdown-bottom");
    expect(container.querySelector(".dropdown-content")).toHaveClass("mb-1");
  });

  test("openDownOnMobile opens downward below lg but upward on desktop", () => {
    const { container } = render(
      <Dropdown trigger="▲" triggerLabel="Border" openDownOnMobile>
        <DropdownItem>Square</DropdownItem>
      </Dropdown>,
    );

    const root = container.querySelector("[data-ui-dropdown]");
    expect(root).toHaveClass("dropdown-bottom", "lg:dropdown-top");
    expect(root).not.toHaveClass("dropdown-top");
    expect(container.querySelector(".dropdown-content")).toHaveClass(
      "mt-1",
      "lg:mt-0",
      "lg:mb-1",
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
