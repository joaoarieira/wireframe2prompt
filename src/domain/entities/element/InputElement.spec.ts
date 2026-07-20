import { describe, expect, test } from "vitest";
import { InputElement } from "./InputElement";
import { wrapText } from "./FieldElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "i1",
  position: Position.create(0, 0),
  size: Size.create(22, 4),
  zIndex: 0,
  layerId: null,
};

const make = (
  props: Partial<{
    label: string | null;
    placeholder: string | null;
    hint: string | null;
  }> = {},
) =>
  InputElement.create({
    ...base,
    label: "Label",
    placeholder: "Placeholder",
    hint: "Hint",
    ...props,
  });

describe("wrapText", () => {
  test("keeps text shorter than the width on one line", () => {
    expect(wrapText("abc", 5)).toEqual(["abc"]);
  });

  test("hard-wraps by character count", () => {
    expect(wrapText("abcdef", 4)).toEqual(["abcd", "ef"]);
  });

  test("preserves explicit newlines, including blank lines", () => {
    expect(wrapText("a\n\nb", 5)).toEqual(["a", "", "b"]);
  });

  test("empty text yields a single empty line", () => {
    expect(wrapText("", 5)).toEqual([""]);
  });

  test("treats a width below 1 as 1", () => {
    expect(wrapText("ab", 0)).toEqual(["a", "b"]);
  });
});

describe("InputElement", () => {
  test("creates with kind input and no arrow", () => {
    const input = make();
    expect(input.kind).toBe("input");
    expect(input.showsArrow).toBe(false);
  });

  test("holds the three text slots", () => {
    const input = make({ label: "L", placeholder: "P", hint: "H" });
    expect(input.label).toBe("L");
    expect(input.placeholder).toBe("P");
    expect(input.hint).toBe("H");
  });

  test("accepts null slots", () => {
    const input = make({ label: null, placeholder: null, hint: null });
    expect(input.label).toBeNull();
    expect(input.placeholder).toBeNull();
    expect(input.hint).toBeNull();
  });

  test("auto-fits height to a single hint line", () => {
    expect(make({ hint: "Hint" }).size.height).toBe(4);
  });

  test("auto-fits height to the wrapped hint", () => {
    const input = make({ hint: "Abcdefghijklmnopqrstuvwxyz" });
    // width 22 => hint wraps at 20 cols => 2 lines => 3 + 2
    expect(input.size.height).toBe(5);
    expect(input.hintLines()).toEqual(["Abcdefghijklmnopqrst", "uvwxyz"]);
  });

  test("resize keeps the width but re-fits height from the hint", () => {
    const resized = make({ hint: "Hint" }).resize(Size.create(30, 99));
    expect(resized.size).toEqual(Size.create(30, 4));
  });

  test("withField replaces the hint and re-fits height", () => {
    const updated = make({ hint: "Hint" }).withField(
      "hint",
      "Abcdefghijklmnopqrstuvwxyz",
    );
    expect(updated.hint).toBe("Abcdefghijklmnopqrstuvwxyz");
    expect(updated.size.height).toBe(5);
  });

  test("withField replaces the label without changing height", () => {
    const updated = make().withField("label", "New");
    expect(updated.label).toBe("New");
    expect(updated.size.height).toBe(4);
  });

  test("withField replaces the placeholder", () => {
    expect(make().withField("placeholder", "New").placeholder).toBe("New");
  });

  test("withField accepts null", () => {
    expect(make().withField("hint", null).hint).toBeNull();
  });

  test("withProps applies the recognised slots and ignores others", () => {
    const updated = make().withProps({
      label: "A",
      placeholder: null,
      hint: "B",
      bogus: 1,
    }) as InputElement;
    expect(updated.label).toBe("A");
    expect(updated.placeholder).toBeNull();
    expect(updated.hint).toBe("B");
  });

  test("withProps ignores a non-string, non-null slot", () => {
    const updated = make({ label: "Keep" }).withProps({
      label: 123,
    }) as InputElement;
    expect(updated.label).toBe("Keep");
  });

  test("cloneWith (move) preserves the slots", () => {
    const moved = make().moveTo(Position.create(5, 5)) as InputElement;
    expect(moved.label).toBe("Label");
    expect(moved.placeholder).toBe("Placeholder");
    expect(moved.hint).toBe("Hint");
  });

  test("labelRegion spans the top border interior", () => {
    expect(make().labelRegion()).toEqual({
      position: Position.create(2, 0),
      size: Size.create(18, 1),
    });
  });

  test("placeholderRegion has no arrow inset", () => {
    expect(make().placeholderRegion()).toEqual({
      position: Position.create(2, 1),
      size: Size.create(18, 1),
    });
  });

  test("hintRegion spans below the box for each wrapped line", () => {
    expect(make({ hint: "Hint" }).hintRegion()).toEqual({
      position: Position.create(1, 3),
      size: Size.create(20, 1),
    });
  });

  test("regions clamp to at least 1 col for a tiny width", () => {
    const tiny = InputElement.create({
      ...base,
      size: Size.create(2, 4),
      label: "L",
      placeholder: "P",
      hint: "",
    });
    expect(tiny.labelRegion().size.width).toBe(1);
    expect(tiny.placeholderRegion().size.width).toBe(1);
    expect(tiny.hintRegion().size.width).toBe(1);
  });

  test.each([
    [Position.create(0, 0), "label"],
    [Position.create(5, 1), "placeholder"],
    [Position.create(5, 2), null],
    [Position.create(5, 3), "hint"],
    [Position.create(5, 4), null],
    [Position.create(30, 0), null],
  ] as const)("fieldAtCell(%o) is %s", (cell, expected) => {
    expect(make({ hint: "Hint" }).fieldAtCell(cell)).toBe(expected);
  });
});
