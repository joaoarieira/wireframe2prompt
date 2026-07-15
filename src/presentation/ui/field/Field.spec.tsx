import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field, FieldLabel } from "./Field";

describe("Field", () => {
  test("renders a fieldset with its legend and children", () => {
    render(
      <Field legend="Size" className="mt-2">
        <input aria-label="width" />
      </Field>,
    );
    const group = screen.getByRole("group", { name: "Size" });
    expect(group).toHaveClass("fieldset", "mt-2");
    expect(screen.getByText("Size")).toHaveClass("fieldset-legend");
    expect(screen.getByLabelText("width")).toBeInTheDocument();
  });
});

describe("FieldLabel", () => {
  test("renders a daisyUI label bound to its control", () => {
    render(<FieldLabel htmlFor="col">Col</FieldLabel>);
    const label = screen.getByText("Col");
    expect(label).toHaveClass("label");
    expect(label).toHaveAttribute("for", "col");
  });
});
