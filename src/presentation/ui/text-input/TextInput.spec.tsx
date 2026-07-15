import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  test("carries the daisyUI input classes plus layout className", () => {
    render(<TextInput aria-label="name" className="w-16" />);
    const input = screen.getByLabelText("name");
    expect(input).toHaveClass("input", "input-sm", "w-16");
  });

  test("forwards native props and change events", () => {
    const onChange = vi.fn();
    render(<TextInput aria-label="qty" type="number" onChange={onChange} />);
    const input = screen.getByLabelText("qty");
    expect(input).toHaveAttribute("type", "number");
    fireEvent.change(input, { target: { value: "3" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
