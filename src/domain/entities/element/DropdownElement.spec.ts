import { describe, expect, test } from "vitest";
import { DropdownElement } from "./DropdownElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "d1",
  position: Position.create(0, 0),
  size: Size.create(22, 4),
  zIndex: 0,
  layerId: null,
  label: "Label",
  placeholder: "Placeholder",
  hint: "Hint",
};

describe("DropdownElement", () => {
  test("creates with kind dropdown and shows an arrow", () => {
    const dropdown = DropdownElement.create(base);
    expect(dropdown.kind).toBe("dropdown");
    expect(dropdown.showsArrow).toBe(true);
  });

  test("placeholderRegion reserves room for the arrow", () => {
    // width 22: input would be 18 wide; the ▼ + gap steal 2 cols.
    expect(DropdownElement.create(base).placeholderRegion()).toEqual({
      position: Position.create(2, 1),
      size: Size.create(16, 1),
    });
  });

  test("rebuild via withField keeps it a DropdownElement", () => {
    const updated = DropdownElement.create(base).withField("label", "New");
    expect(updated).toBeInstanceOf(DropdownElement);
    expect(updated.label).toBe("New");
  });

  test("resize keeps it a DropdownElement", () => {
    const resized = DropdownElement.create(base).resize(Size.create(30, 9));
    expect(resized).toBeInstanceOf(DropdownElement);
    expect(resized.size.width).toBe(30);
  });
});
