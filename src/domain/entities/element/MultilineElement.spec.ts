import { describe, expect, test } from "vitest";
import { MultilineElement } from "./MultilineElement";
import { InvalidMultilinePointError } from "../errors/InvalidMultilinePointError";
import { Position } from "../position/Position";
import { Size } from "../size/Size";
import { BorderStyle } from "../../value-objects/border-style/BorderStyle";

const p = (col: number, row: number) => ({ col, row });

function element() {
  return MultilineElement.create({
    id: "ml1",
    zIndex: 0,
    layerId: null,
    points: [p(2, 1), p(6, 1), p(6, 4)],
  });
}

describe("MultilineElement", () => {
  test("normalizes the origin to the bounding-box top-left", () => {
    const el = element();
    expect(el.kind).toBe("multiline");
    expect(el.position.equals(Position.create(2, 1))).toBe(true);
  });

  test("stores vertices relative to the origin", () => {
    expect(element().points).toEqual([p(0, 0), p(4, 0), p(4, 3)]);
  });

  test("derives its size from the vertices' bounding box", () => {
    expect(element().size.equals(Size.create(5, 4))).toBe(true);
  });

  test("normalizes the origin when the path first runs upward", () => {
    const el = MultilineElement.create({
      id: "up",
      zIndex: 0,
      layerId: null,
      points: [p(2, 5), p(2, 2), p(6, 2)],
    });
    expect(el.position.equals(Position.create(2, 2))).toBe(true);
    expect(el.points).toEqual([p(0, 3), p(0, 0), p(4, 0)]);
  });

  test("absolutePoints returns the original grid coordinates", () => {
    const abs = element().absolutePoints();
    expect(abs.map((point) => [point.col, point.row])).toEqual([
      [2, 1],
      [6, 1],
      [6, 4],
    ]);
  });

  test("moving shifts the origin but keeps the relative vertices", () => {
    const moved = element().translate(1, 1) as MultilineElement;
    expect(moved.position.equals(Position.create(3, 2))).toBe(true);
    expect(moved.points).toEqual([p(0, 0), p(4, 0), p(4, 3)]);
    expect(moved.absolutePoints()[2].equals(Position.create(7, 5))).toBe(true);
  });

  test("resize is a no-op", () => {
    const el = element();
    expect(el.resize(Size.create(20, 20))).toBe(el);
  });

  test("withProps ignores kind-specific keys but still renames", () => {
    const renamed = element().withProps({
      name: "path",
      points: [],
    }) as MultilineElement;
    expect(renamed.name).toBe("path");
    expect(renamed.points).toEqual([p(0, 0), p(4, 0), p(4, 3)]);
  });

  test("withId keeps the geometry", () => {
    const clone = element().withId("ml2") as MultilineElement;
    expect(clone.id).toBe("ml2");
    expect(clone.points).toEqual(element().points);
  });

  test("has a border, so a border style applies to it", () => {
    expect(element().hasBorder).toBe(true);
  });

  test("carries a border style and re-styles like a box", () => {
    const rounded = element().withBorderStyle(
      BorderStyle.rounded(),
    ) as MultilineElement;
    expect(BorderStyle.nameOf(rounded.borderStyle)).toBe("rounded");
    expect(rounded.points).toEqual(element().points);
  });

  test("rejects fewer than two points", () => {
    expect(() =>
      MultilineElement.create({
        id: "x",
        zIndex: 0,
        layerId: null,
        points: [p(0, 0)],
      }),
    ).toThrow(InvalidMultilinePointError);
  });

  test("rejects non-integer coordinates", () => {
    expect(() =>
      MultilineElement.create({
        id: "x",
        zIndex: 0,
        layerId: null,
        points: [p(0, 0), p(1.5, 0)],
      }),
    ).toThrow(InvalidMultilinePointError);
  });

  test("rejects identical consecutive points", () => {
    expect(() =>
      MultilineElement.create({
        id: "x",
        zIndex: 0,
        layerId: null,
        points: [p(3, 3), p(3, 3)],
      }),
    ).toThrow(InvalidMultilinePointError);
  });

  test("rejects a diagonal segment", () => {
    expect(() =>
      MultilineElement.create({
        id: "x",
        zIndex: 0,
        layerId: null,
        points: [p(0, 0), p(2, 2)],
      }),
    ).toThrow(InvalidMultilinePointError);
  });
});
