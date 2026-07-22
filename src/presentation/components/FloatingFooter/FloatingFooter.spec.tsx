import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FloatingFooter } from "./FloatingFooter";
import { editorStore } from "../../state/app-store/appStore";
import i18n from "../../i18n/i18n";

/** The store is an app-wide singleton; drive tool state through it. */
function setTool(toolId: string): void {
  act(() => {
    editorStore.getState().setActiveTool(toolId);
  });
}

/**
 * The group's top-layer popover menu, to scope queries to its options. Groups
 * render via Dropdown `overlay`, so the menu is a `[popover]` list anchored to
 * the trigger by id (its `popovertarget`), not an ancestor `.dropdown` wrapper.
 */
function dropdownOf(triggerName: string): HTMLElement {
  const trigger = screen.getByRole("button", { name: triggerName });
  const menuId = trigger.getAttribute("popovertarget");
  const menu = menuId && document.getElementById(menuId);
  if (!(menu instanceof HTMLElement)) {
    throw new Error(`no popover menu targets the trigger "${triggerName}"`);
  }
  return menu;
}

/** Reads a menu option button; the [popover] menu is hidden to role queries. */
function menuOption(triggerName: string, name: string): HTMLElement {
  return within(dropdownOf(triggerName)).getByRole("button", {
    name,
    hidden: true,
  });
}

/** The group's quick-select segment — the same-named button outside the menu. */
function quickButton(name: string): HTMLElement {
  const button = screen
    .getAllByRole("button", { name })
    .find((candidate) => candidate.closest(".dropdown") === null);
  if (button === undefined) {
    throw new Error(`no quick-select button named "${name}"`);
  }
  return button;
}

beforeEach(() => setTool("select"));

afterEach(async () => {
  setTool("select");
  editorStore.setState({ layersPanelOpen: false });
  // Toolbar-style guard: restore English if a test switched to Portuguese.
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

describe("FloatingFooter tool palette", () => {
  test("renders the standalone tools as named icon buttons", () => {
    render(<FloatingFooter />);

    // select is active by default → the filled (neutral) button
    expect(screen.getByRole("button", { name: "Select" })).toHaveClass(
      "btn-neutral",
    );
    expect(screen.getByRole("button", { name: "Hand" })).toHaveClass(
      "btn-ghost",
    );
    expect(screen.getByRole("button", { name: "Text" })).toBeInTheDocument();
  });

  test("a tool with a shortcut appends it to the tooltip only", () => {
    render(<FloatingFooter />);
    const text = screen.getByRole("button", { name: "Text" });
    // aria-label stays the bare name; the shortcut rides on the title tooltip.
    expect(text).toHaveAttribute("title", "Text (T)");
    expect(text).toHaveAttribute("aria-label", "Text");
  });

  test("a tool without a shortcut keeps a plain tooltip", () => {
    setTool("dropdown"); // the Containers quick button now shows Dropdown
    render(<FloatingFooter />);
    expect(quickButton("Dropdown")).toHaveAttribute("title", "Dropdown");
  });

  test("clicking a standalone tool makes it the active tool", () => {
    render(<FloatingFooter />);
    const hand = screen.getByRole("button", { name: "Hand" });
    expect(hand).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(hand);

    expect(editorStore.getState().activeToolId).toBe("hand");
    expect(screen.getByRole("button", { name: "Hand" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("each group exposes an upward 'more' trigger", () => {
    render(<FloatingFooter />);

    expect(
      screen.getByRole("button", { name: "More Shapes tools" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "More Containers tools" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "More Draw tools" }),
    ).toBeInTheDocument();
  });

  test("a group is inactive until one of its members is picked", () => {
    render(<FloatingFooter />);
    expect(
      screen.getByRole("button", { name: "More Shapes tools" }),
    ).toHaveClass("btn-ghost");

    fireEvent.click(menuOption("More Shapes tools", "Line"));

    expect(editorStore.getState().activeToolId).toBe("line");
    expect(
      screen.getByRole("button", { name: "More Shapes tools" }),
    ).toHaveClass("btn-neutral");
  });

  test("the group's quick button reflects and re-selects the active member", () => {
    setTool("arrow");
    render(<FloatingFooter />);

    const quick = quickButton("Arrow");
    expect(quick).toHaveClass("btn-neutral");
    expect(quick).toHaveAttribute("aria-pressed", "true");

    setTool("select"); // switch away, then re-pick via the quick button
    fireEvent.click(quickButton("Box")); // default member when none is active
    expect(editorStore.getState().activeToolId).toBe("box");
  });

  test("picking pencil reveals the pencil-character input", () => {
    render(<FloatingFooter />);
    expect(screen.queryByLabelText("Pencil character")).toBeNull();

    fireEvent.click(menuOption("More Draw tools", "Pencil"));

    expect(editorStore.getState().activeToolId).toBe("pencil");
    const input = screen.getByLabelText("Pencil character");

    fireEvent.change(input, { target: { value: "ab" } });
    expect(editorStore.getState().pencilChar.value).toBe("b");

    // an empty value is ignored, keeping the previous character
    fireEvent.change(input, { target: { value: "" } });
    expect(editorStore.getState().pencilChar.value).toBe("b");
  });

  test("the scrolling tool strip keeps a stable clip; groups escape via overlay", () => {
    render(<FloatingFooter />);
    // The strip scrolls horizontally and stays clipped even while a group menu
    // is open — the menu escapes in the top layer (Dropdown `overlay`), so the
    // strip never drops its overflow.
    const strip = screen.getByRole("button", { name: "Select" }).parentElement;
    expect(strip).toHaveClass(
      "overflow-x-auto",
      // the inset scroll-shadow that hints at more tools off-edge
      "scroll-shadow-x",
    );
    // Regression: lifting the clip while a menu is open reset scrollLeft to 0 and
    // un-hid the off-edge tools, so the strip must NOT toggle its overflow.
    expect(strip).not.toHaveClass(
      "has-[[data-ui-dropdown]:focus-within]:overflow-visible",
    );
    expect(strip).not.toHaveClass("has-[:focus]:overflow-visible");
    // The group trigger opens a top-layer popover instead.
    expect(
      screen.getByRole("button", { name: "More Shapes tools" }),
    ).toHaveAttribute("popovertarget");
  });

  test("palette buttons are compact: no tap-floor inflation below lg", () => {
    render(<FloatingFooter />);
    // Tools and group triggers keep btn-sm's size on small touch screens so
    // the strip stays short; the 44px floor only returns at desktop widths.
    for (const name of ["Select", "More Shapes tools"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveClass("lg:[@media(pointer:coarse)]:min-h-11");
      expect(button).not.toHaveClass("[@media(pointer:coarse)]:min-h-11");
    }
  });

  test("the Layers button toggles the layers panel state", () => {
    render(<FloatingFooter />);
    expect(editorStore.getState().layersPanelOpen).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(editorStore.getState().layersPanelOpen).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Layers" }));
    expect(editorStore.getState().layersPanelOpen).toBe(false);
  });

  test("group trigger and options translate with the active language", async () => {
    render(<FloatingFooter />);

    await act(async () => {
      await i18n.changeLanguage("pt");
    });

    expect(
      screen.getByRole("button", { name: "Mais ferramentas de Formas" }),
    ).toBeInTheDocument();
    expect(
      menuOption("Mais ferramentas de Formas", "Linha"),
    ).toBeInTheDocument();
  });
});
