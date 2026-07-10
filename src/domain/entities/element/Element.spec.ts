import { describe, expect, test } from "vitest";
import { BoxElement } from "./BoxElement";
import { LineElement } from "./LineElement";
import { TextElement } from "./TextElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";
import { BorderStyle } from "../../value-objects/border-style/BorderStyle";
import { InvalidSizeError } from "../errors/InvalidSizeError";

const base = {
  id: "e1",
  position: Position.create(1, 1),
  size: Size.create(4, 3),
  zIndex: 0,
  layerId: null,
};

describe("Element", () => {
  test("BoxElement defaults to the ASCII border style", () => {
    const box = BoxElement.create(base);
    expect(box.kind).toBe("box");
    expect(box.borderStyle.equals(BorderStyle.ascii())).toBe(true);
  });

  test("must reject a non-positive size (invariant lives in Size)", () => {
    expect(() =>
      BoxElement.create({ ...base, size: Size.create(0, 1) }),
    ).toThrow(InvalidSizeError);
  });

  test("moveTo must return a new element preserving type-specific props", () => {
    const text = TextElement.create({ ...base, text: "OK" });
    const moved = text.moveTo(Position.create(5, 5));
    expect(moved).not.toBe(text);
    expect(moved).toBeInstanceOf(TextElement);
    expect((moved as TextElement).text).toBe("OK");
    expect(moved.position.equals(Position.create(5, 5))).toBe(true);
    expect(text.position.equals(Position.create(1, 1))).toBe(true);
  });

  test("translate must offset the position immutably", () => {
    const box = BoxElement.create(base);
    const moved = box.translate(2, -1);
    expect(moved.position.equals(Position.create(3, 0))).toBe(true);
    expect(box.position.equals(Position.create(1, 1))).toBe(true);
  });

  test("resize must return a new element with the new size", () => {
    const box = BoxElement.create(base);
    const resized = box.resize(Size.create(10, 2));
    expect(resized.size.equals(Size.create(10, 2))).toBe(true);
    expect(box.size.equals(Size.create(4, 3))).toBe(true);
  });

  test("withZIndex must return a new element with the new z-index", () => {
    const box = BoxElement.create(base);
    expect(box.withZIndex(7).zIndex).toBe(7);
    expect(box.zIndex).toBe(0);
  });

  test("LineElement keeps orientation; withProps updates it", () => {
    const line = LineElement.create({ ...base, orientation: "h" });
    expect(line.orientation).toBe("h");
    const vertical = line.withProps({ orientation: "v" });
    expect(vertical.orientation).toBe("v");
    expect(line.orientation).toBe("h");
  });

  test("TextElement withProps updates the text immutably", () => {
    const text = TextElement.create({ ...base, text: "OK" });
    const edited = text.withProps({ text: "Cancel" });
    expect(edited.text).toBe("Cancel");
    expect(text.text).toBe("OK");
  });

  test("withProps ignores unknown / mistyped keys", () => {
    const text = TextElement.create({ ...base, text: "OK" });
    expect(text.withProps({ text: 123 }).text).toBe("OK");
    expect(text.withProps({ unrelated: "x" }).text).toBe("OK");
  });
});
