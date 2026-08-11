import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  test("openDown opens downward on every screen size", () => {
    const { container } = render(
      <Dropdown trigger="⋮" triggerLabel="Actions" openDown openDownOnMobile>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    );

    const root = container.querySelector("[data-ui-dropdown]");
    expect(root).toHaveClass("dropdown-bottom");
    expect(root).not.toHaveClass("lg:dropdown-top");
    expect(container.querySelector(".dropdown-content")).toHaveClass("mt-1");
  });

  test("overlay honours openDown on the popover menu", () => {
    const { container } = render(
      <Dropdown trigger="⋮" triggerLabel="Actions" overlay openDown>
        <DropdownItem>Rename</DropdownItem>
      </Dropdown>,
    );

    const menu = container.querySelector<HTMLElement>("[popover]");
    expect(menu).toHaveClass("dropdown-bottom", "mt-1");
    expect(menu).not.toHaveClass("dropdown-top", "mb-1");
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

  test("overlay renders a popover menu anchored to the trigger button", () => {
    const { container } = render(
      <Dropdown
        trigger="▲"
        triggerLabel="More tools"
        overlay
        menuLabel="Shapes"
      >
        <DropdownItem>Box</DropdownItem>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: "More tools" });
    const menuId = trigger.getAttribute("popovertarget");
    expect(menuId).toBeTruthy();

    // The menu is a top-layer popover whose id matches the trigger's target, so
    // it escapes a clipping/scrolling ancestor without lifting its overflow.
    const menu = container.querySelector<HTMLElement>("[popover]");
    expect(menu).not.toBeNull();
    expect(menu).toHaveAttribute("id", menuId!);
    expect(menu).toHaveClass("dropdown", "dropdown-top", "mb-1", "menu");
    // anchored: the trigger names an anchor the menu positions against.
    expect(trigger.style.anchorName).toBe(menu!.style.positionAnchor);
    expect(trigger.style.anchorName).toMatch(/^--dd-/);
    expect(screen.getByText("Shapes")).toHaveClass("menu-title");
  });

  test("overlay honours openDownOnMobile on the popover menu", () => {
    const { container } = render(
      <Dropdown trigger="▲" triggerLabel="Border" overlay openDownOnMobile>
        <DropdownItem>Square</DropdownItem>
      </Dropdown>,
    );

    const menu = container.querySelector<HTMLElement>("[popover]");
    expect(menu).toHaveClass("dropdown-bottom", "lg:dropdown-top", "mt-1");
    expect(menu).not.toHaveClass("dropdown-top", "mb-1");
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

  test("inside a popover, click hides the popover instead of blurring", () => {
    const { container } = render(
      <div popover="auto">
        <DropdownItem>Line</DropdownItem>
      </div>,
    );
    const popover = container.querySelector<HTMLElement>("[popover]")!;
    const hidePopover = vi.fn();
    // jsdom may not implement the Popover API, so stub the method we call.
    Object.defineProperty(popover, "hidePopover", { value: hidePopover });
    // a [popover] is hidden to role queries, so reach the button directly.
    const item = within(popover).getByRole("button", {
      name: "Line",
      hidden: true,
    });
    item.focus();

    fireEvent.click(item);

    expect(hidePopover).toHaveBeenCalledTimes(1);
    // it dismisses the menu via the popover, so it does not also blur itself.
    expect(item).toHaveFocus();
  });
});
