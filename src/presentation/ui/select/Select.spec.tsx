import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "./Select";

describe("Select", () => {
  test("carries the daisyUI select classes and renders its options", () => {
    render(
      <Select aria-label="orientation" className="w-full" defaultValue="h">
        <option value="h">Horizontal</option>
        <option value="v">Vertical</option>
      </Select>,
    );
    const select = screen.getByLabelText("orientation");
    expect(select).toHaveClass("select", "select-sm", "w-full");
    expect(
      screen.getByRole("option", { name: "Vertical" }),
    ).toBeInTheDocument();
  });

  test("forwards change events", () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="orientation" value="h" onChange={onChange}>
        <option value="h">Horizontal</option>
        <option value="v">Vertical</option>
      </Select>,
    );
    fireEvent.change(screen.getByLabelText("orientation"), {
      target: { value: "v" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
