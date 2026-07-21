import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  test("defaults to a non-submitting button element", () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("btn");
  });

  test("danger variant carries the destructive daisyUI classes", () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass("btn", "btn-outline", "btn-error");
  });

  test("active adds btn-active and size adds its modifier", () => {
    render(
      <Button size="sm" active>
        Tool
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Tool" })).toHaveClass(
      "btn-sm",
      "btn-active",
    );
  });

  test("carries a 44px minimum tap target on coarse pointers", () => {
    render(<Button>Tap</Button>);
    expect(screen.getByRole("button", { name: "Tap" })).toHaveClass(
      "[@media(pointer:coarse)]:min-h-11",
      "[@media(pointer:coarse)]:min-w-11",
    );
  });

  test("compact keeps the small-screen size, restoring the floor on lg", () => {
    render(<Button compact>Tap</Button>);
    const button = screen.getByRole("button", { name: "Tap" });
    expect(button).toHaveClass(
      "lg:[@media(pointer:coarse)]:min-h-11",
      "lg:[@media(pointer:coarse)]:min-w-11",
    );
    expect(button).not.toHaveClass("[@media(pointer:coarse)]:min-h-11");
  });

  test("forwards native props and layout className", () => {
    const onClick = vi.fn();
    render(
      <Button className="mt-2" aria-label="save" onClick={onClick} disabled />,
    );
    const button = screen.getByLabelText("save");
    expect(button).toHaveClass("mt-2");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled(); // disabled swallows the click
  });
});
