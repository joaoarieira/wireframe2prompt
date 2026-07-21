import { describe, expect, test } from "vitest";
import { BorderStyle } from "./BorderStyle";
import { InvalidCellCharError } from "../../entities/errors/InvalidCellCharError";

const fullParts = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",
  teeDown: "┬",
  teeUp: "┴",
  cross: "┼",
};

describe("BorderStyle", () => {
  test("square() uses square unicode corners and unicode junctions", () => {
    const style = BorderStyle.square();
    expect(style.topLeft.value).toBe("┌");
    expect(style.bottomRight.value).toBe("┘");
    expect(style.horizontal.value).toBe("─");
    expect(style.vertical.value).toBe("│");
    expect(style.cross.value).toBe("┼");
    expect(style.teeDown.value).toBe("┬");
  });

  test("rounded() swaps only the corners for arcs; the rest matches square", () => {
    const style = BorderStyle.rounded();
    expect(style.topLeft.value).toBe("╭");
    expect(style.topRight.value).toBe("╮");
    expect(style.bottomLeft.value).toBe("╰");
    expect(style.bottomRight.value).toBe("╯");
    expect(style.horizontal.value).toBe("─");
    expect(style.cross.value).toBe("┼");
    expect(style.teeRight.value).toBe("├");
  });

  test("cross() uses '+' for every corner and junction, '-'/'|' for edges", () => {
    const style = BorderStyle.cross();
    expect(style.topLeft.value).toBe("+");
    expect(style.bottomRight.value).toBe("+");
    expect(style.cross.value).toBe("+");
    expect(style.teeLeft.value).toBe("+");
    expect(style.horizontal.value).toBe("-");
    expect(style.vertical.value).toBe("|");
  });

  test("named() resolves each border style name", () => {
    expect(BorderStyle.named("square").equals(BorderStyle.square())).toBe(true);
    expect(BorderStyle.named("rounded").equals(BorderStyle.rounded())).toBe(
      true,
    );
    expect(BorderStyle.named("cross").equals(BorderStyle.cross())).toBe(true);
  });

  test("nameOf() reports the matching name, or null for a custom style", () => {
    expect(BorderStyle.nameOf(BorderStyle.square())).toBe("square");
    expect(BorderStyle.nameOf(BorderStyle.rounded())).toBe("rounded");
    expect(BorderStyle.nameOf(BorderStyle.cross())).toBe("cross");
    const custom = BorderStyle.create({ ...fullParts, topLeft: "#" });
    expect(BorderStyle.nameOf(custom)).toBeNull();
  });

  test("create must accept custom characters", () => {
    const style = BorderStyle.create({
      ...fullParts,
      topLeft: "╔",
      cross: "╬",
    });
    expect(style.topLeft.value).toBe("╔");
    expect(style.cross.value).toBe("╬");
  });

  test("must throw when any part is not a single character", () => {
    expect(() => BorderStyle.create({ ...fullParts, topLeft: "++" })).toThrow(
      InvalidCellCharError,
    );
  });

  test("two square border styles must be equal", () => {
    expect(BorderStyle.square().equals(BorderStyle.square())).toBe(true);
  });

  test("styles differing only in a junction are not equal", () => {
    const oddCross = BorderStyle.create({ ...fullParts, cross: "*" });
    expect(BorderStyle.square().equals(oddCross)).toBe(false);
  });
});
