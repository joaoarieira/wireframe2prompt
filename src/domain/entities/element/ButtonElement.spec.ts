import { describe, expect, test } from "vitest";
import { ButtonElement } from "./ButtonElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "b1",
  position: Position.create(0, 0),
  size: Size.create(8, 3),
  zIndex: 0,
  layerId: null,
};

describe("ButtonElement", () => {
  test("creates with text and is bordered", () => {
    const button = ButtonElement.create({ ...base, text: "Text" });
    expect(button.kind).toBe("button");
    expect(button.text).toBe("Text");
    expect(button.hasBorder).toBe(true);
    expect(button.size.equals(Size.create(8, 3))).toBe(true);
  });

  test("create grows the box to fit a label larger than the given size", () => {
    const button = ButtonElement.create({
      ...base,
      size: Size.create(4, 3),
      text: "Long label",
    });
    expect(button.size.equals(Size.create(12, 3))).toBe(true);
  });

  test("withText grows the width to the right, keeping the top-left corner", () => {
    const button = ButtonElement.create({
      ...base,
      position: Position.create(2, 5),
      text: "Text",
    });
    const grown = button.withText("A longer label");

    expect(grown.text).toBe("A longer label");
    // "A longer label" is 14 chars → 14 + 2 borders.
    expect(grown.size.equals(Size.create(16, 3))).toBe(true);
    // Top-left corner is fixed → the box extended rightward only.
    expect(grown.position.equals(Position.create(2, 5))).toBe(true);
  });

  test("withText grows the height downward when the label wraps to more lines", () => {
    const button = ButtonElement.create({
      ...base,
      position: Position.create(2, 5),
      text: "Text",
    });
    const grown = button.withText("Line 1\nLine 2\nLine 3");

    // 3 lines → 3 + 2 borders; widest line "Line 1"/"Line 2"/"Line 3" is 6.
    expect(grown.size.equals(Size.create(8, 5))).toBe(true);
    expect(grown.position.equals(Position.create(2, 5))).toBe(true);
  });

  test("withText never shrinks a box the user made larger", () => {
    const button = ButtonElement.create({
      ...base,
      size: Size.create(20, 6),
      text: "Big",
    });
    expect(button.withText("Hi").size.equals(Size.create(20, 6))).toBe(true);
  });

  test("resize clamps up to the label's minimum size", () => {
    const button = ButtonElement.create({
      ...base,
      size: Size.create(12, 3),
      text: "Long label",
    });
    const resized = button.resize(Size.create(4, 1));
    // Can't go below "Long label" (10) + 2 borders wide, nor below 1 line + 2.
    expect(resized.size.equals(Size.create(12, 3))).toBe(true);
  });

  test("resize keeps a size larger than the label", () => {
    const button = ButtonElement.create({ ...base, text: "Text" });
    expect(
      button.resize(Size.create(20, 8)).size.equals(Size.create(20, 8)),
    ).toBe(true);
  });

  test("withKindProps accepts string text and grows the box", () => {
    const button = ButtonElement.create({ ...base, text: "A" });
    const updated = button.withProps({
      text: "A much longer label",
    }) as ButtonElement;
    expect(updated.text).toBe("A much longer label");
    expect(updated.size.width).toBe("A much longer label".length + 2);
  });

  test("withKindProps ignores non-string text", () => {
    const button = ButtonElement.create({ ...base, text: "A" });
    const updated = button.withProps({ text: 123 }) as ButtonElement;
    expect(updated.text).toBe("A");
  });

  test("cloneWith preserves text on move", () => {
    const button = ButtonElement.create({ ...base, text: "Go" });
    const moved = button.moveTo(Position.create(5, 5)) as ButtonElement;
    expect(moved.text).toBe("Go");
    expect(moved.position.equals(Position.create(5, 5))).toBe(true);
  });

  test("textLines splits the label on newlines", () => {
    const button = ButtonElement.create({ ...base, text: "a\nbb" });
    expect(button.textLines()).toEqual(["a", "bb"]);
  });

  test("innerTextWidth / innerTextHeight are the box minus its borders", () => {
    const button = ButtonElement.create({
      ...base,
      size: Size.create(8, 5),
      text: "x",
    });
    expect(button.innerTextWidth()).toBe(6);
    expect(button.innerTextHeight()).toBe(3);
  });

  test("textTopRow vertically centers the label block", () => {
    const single = ButtonElement.create({ ...base, text: "x" });
    expect(single.textTopRow()).toBe(1);
    const tall = ButtonElement.create({
      ...base,
      position: Position.create(0, 2),
      size: Size.create(8, 5),
      text: "x",
    });
    expect(tall.textTopRow()).toBe(2 + 2);
  });

  test("textStartCol horizontally centers a line and clamps when too wide", () => {
    const button = ButtonElement.create({ ...base, text: "Text" });
    expect(button.textStartCol(4)).toBe(2);
    expect(button.textStartCol(10)).toBe(1);
  });

  test("textRegion is the centered block of the widest line by line count", () => {
    const button = ButtonElement.create({ ...base, text: "Hi\nWorld" });
    const region = button.textRegion();
    // widest "World" = 5, 2 lines. Box grew to fit: 7×4, inner 5×2.
    expect(button.size.equals(Size.create(8, 4))).toBe(true);
    expect(region.size.equals(Size.create(5, 2))).toBe(true);
    expect(region.position.equals(Position.create(1, 1))).toBe(true);
  });

  test("textRegion size never drops below 1×1 for empty text", () => {
    const button = ButtonElement.create({ ...base, text: "" });
    expect(button.textRegion().size.equals(Size.create(1, 1))).toBe(true);
  });
});
