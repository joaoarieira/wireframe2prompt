import { describe, expect, test } from "vitest";
import { BoxElement } from "./BoxElement";
import { LineElement } from "./LineElement";
import { TextElement } from "./TextElement";
import { FreeDrawElement } from "./FreeDrawElement";
import { CellChar } from "../cell-char/CellChar";
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

const heavy = BorderStyle.cross();

describe("Element", () => {
  test("BoxElement defaults to the square border style", () => {
    const box = BoxElement.create(base);
    expect(box.kind).toBe("box");
    expect(box.borderStyle.equals(BorderStyle.square())).toBe(true);
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
    const vertical = line.withProps({ orientation: "v" }) as LineElement;
    expect(vertical.orientation).toBe("v");
    expect(line.orientation).toBe("h");
  });

  test("TextElement withProps updates the text immutably", () => {
    const text = TextElement.create({ ...base, text: "OK" });
    const edited = text.withProps({ text: "Cancel" }) as TextElement;
    expect(edited.text).toBe("Cancel");
    expect(text.text).toBe("OK");
  });

  test("withProps ignores unknown / mistyped keys", () => {
    const text = TextElement.create({ ...base, text: "OK" });
    expect((text.withProps({ text: 123 }) as TextElement).text).toBe("OK");
    expect((text.withProps({ unrelated: "x" }) as TextElement).text).toBe("OK");
  });

  test("name defaults to null and withName renames immutably", () => {
    const box = BoxElement.create(base);
    expect(box.name).toBeNull();

    const named = box.withName("Header");
    expect(named.name).toBe("Header");
    expect(named).not.toBe(box);
    expect(box.name).toBeNull();
  });

  test("mutators preserve the name (cloneWith)", () => {
    const named = BoxElement.create({ ...base, name: "Header" });
    expect(named.moveTo(Position.create(9, 9)).name).toBe("Header");
    expect(named.resize(Size.create(2, 2)).name).toBe("Header");
  });

  test("withProps handles name for every kind, alone or with kind props", () => {
    const box = BoxElement.create(base);
    expect(box.withProps({ name: "B" }).name).toBe("B");

    const text = TextElement.create({ ...base, text: "OK" });
    const edited = text.withProps({ name: "T", text: "Hi" }) as TextElement;
    expect(edited.name).toBe("T");
    expect(edited.text).toBe("Hi");

    expect(
      box.withProps({ name: "B" }).withProps({ name: null }).name,
    ).toBeNull();
    expect(box.withProps({ name: 123 }).name).toBeNull(); // mistyped → ignored
  });

  test("TextElement size always fits its content, including line breaks", () => {
    const text = TextElement.create({ ...base, text: "OK" });

    const multiline = text.withText("ab\ncdef");
    expect(multiline.size.equals(Size.create(4, 2))).toBe(true);

    const emptied = text.withProps({ text: "" });
    expect(emptied.size.equals(Size.create(1, 1))).toBe(true);
  });

  test("withId must return a clone with the new id, same type and rest preserved", () => {
    const box = BoxElement.create({ ...base, name: "Header" });
    const copy = box.withId("new-id");
    expect(copy.id).toBe("new-id");
    expect(box.id).toBe("e1");
    expect(copy).toBeInstanceOf(BoxElement);
    expect(copy.name).toBe("Header");
    expect(copy.position.equals(box.position)).toBe(true);
  });

  test("withId on FreeDrawElement preserves the cells map", () => {
    const el = FreeDrawElement.create({
      id: "fd1",
      position: Position.create(0, 0),
      layerId: null,
      zIndex: 0,
      cells: new Map([["0,0", CellChar.create("*")]]),
    });
    const copy = el.withId("fd2");
    expect(copy.id).toBe("fd2");
    expect(copy).toBeInstanceOf(FreeDrawElement);
    expect((copy as FreeDrawElement).cells.size).toBe(1);
  });

  test("withLayer must return a new element assigned to the given layer", () => {
    const box = BoxElement.create(base);
    const assigned = box.withLayer("layer-1");
    expect(assigned.layerId).toBe("layer-1");
    expect(assigned).not.toBe(box);
    expect(box.layerId).toBeNull();
  });

  test("BoxElement withBorderStyle must return a new box with the new style", () => {
    const box = BoxElement.create(base);
    const styled = box.withBorderStyle(heavy);
    expect(styled.borderStyle.equals(heavy)).toBe(true);
    expect(styled).not.toBe(box);
    expect(box.borderStyle.equals(BorderStyle.square())).toBe(true);
  });

  test("BoxElement withProps updates the border style and ignores other keys", () => {
    const box = BoxElement.create(base);
    expect(
      (box.withProps({ borderStyle: heavy }) as BoxElement).borderStyle.equals(
        heavy,
      ),
    ).toBe(true);
    expect(box.withProps({ text: "x" })).toBe(box);
  });

  test("LineElement mutators preserve orientation (cloneWith)", () => {
    const line = LineElement.create({ ...base, orientation: "v" });
    const moved = line.moveTo(Position.create(6, 6));
    expect(moved).toBeInstanceOf(LineElement);
    expect((moved as LineElement).orientation).toBe("v");
    expect(moved.position.equals(Position.create(6, 6))).toBe(true);
  });

  test("LineElement withProps ignores an invalid orientation", () => {
    const line = LineElement.create({ ...base, orientation: "h" });
    expect(line.withProps({ orientation: "diagonal" })).toBe(line);
    expect(line.withProps({ text: "x" })).toBe(line);
  });
});
