import { describe, expect, test } from "vitest";
import { BorderStyle } from "./BorderStyle";
import { InvalidCellCharError } from "../../entities/errors/InvalidCellCharError";

describe("BorderStyle", () => {
  test("ascii() must use + for corners, - for horizontal and | for vertical", () => {
    const style = BorderStyle.ascii();
    expect(style.topLeft.value).toBe("+");
    expect(style.topRight.value).toBe("+");
    expect(style.bottomLeft.value).toBe("+");
    expect(style.bottomRight.value).toBe("+");
    expect(style.horizontal.value).toBe("-");
    expect(style.vertical.value).toBe("|");
  });

  test("create must accept custom (e.g. Unicode) characters", () => {
    const style = BorderStyle.create({
      topLeft: "┌",
      topRight: "┐",
      bottomLeft: "└",
      bottomRight: "┘",
      horizontal: "─",
      vertical: "│",
    });
    expect(style.topLeft.value).toBe("┌");
    expect(style.bottomRight.value).toBe("┘");
  });

  test("must throw when any part is not a single character", () => {
    expect(() =>
      BorderStyle.create({
        topLeft: "++",
        topRight: "+",
        bottomLeft: "+",
        bottomRight: "+",
        horizontal: "-",
        vertical: "|",
      }),
    ).toThrow(InvalidCellCharError);
  });

  test("two ascii border styles must be equal", () => {
    expect(BorderStyle.ascii().equals(BorderStyle.ascii())).toBe(true);
  });
});
