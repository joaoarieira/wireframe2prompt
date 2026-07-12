import { describe, expect, test } from "vitest";
import { elementAtCell, zIndexForPlacement } from "./hitTest";
import { makeDoc } from "../../../tests/fixtures";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

function box(id: string, col: number, row: number, zIndex = 0): BoxElement {
  return BoxElement.create({
    id,
    position: Position.create(col, row),
    size: Size.create(4, 3),
    zIndex,
    layerId: null,
  });
}

describe("elementAtCell", () => {
  test("returns null on empty space", () => {
    const document = makeDoc(box("a", 0, 0));
    expect(elementAtCell(document, Position.create(10, 8))).toBeNull();
  });

  test("returns the element covering the cell (edges inclusive)", () => {
    const document = makeDoc(box("a", 2, 1));
    expect(elementAtCell(document, Position.create(2, 1))?.id).toBe("a");
    expect(elementAtCell(document, Position.create(5, 3))?.id).toBe("a");
    expect(elementAtCell(document, Position.create(6, 1))).toBeNull();
    expect(elementAtCell(document, Position.create(2, 4))).toBeNull();
  });

  test("higher z-index wins on overlap, matching the compositor", () => {
    const document = makeDoc(box("under", 0, 0, 1), box("over", 2, 1, 2));
    expect(elementAtCell(document, Position.create(3, 2))?.id).toBe("over");
    expect(elementAtCell(document, Position.create(0, 0))?.id).toBe("under");
  });

  test("z-index tie: the later element wins, matching the compositor", () => {
    const document = makeDoc(box("first", 0, 0), box("second", 0, 0));
    expect(elementAtCell(document, Position.create(1, 1))?.id).toBe("second");
  });
});

describe("zIndexForPlacement", () => {
  const at = Position.create;
  const size = Size.create;

  test("no overlap → base z-index 0, even with high-z elements elsewhere", () => {
    const document = makeDoc(box("a", 0, 0, 9));
    expect(zIndexForPlacement(document, at(10, 6), size(4, 3))).toBe(0);
  });

  test("overlap → highest overlapped z-index + 1", () => {
    // boxes are 4×3: "under" covers (0,0)-(3,2), "over" covers (2,1)-(5,3)
    const document = makeDoc(box("under", 0, 0, 1), box("over", 2, 1, 5));
    expect(zIndexForPlacement(document, at(0, 0), size(2, 2))).toBe(2);
    expect(zIndexForPlacement(document, at(3, 2), size(1, 1))).toBe(6);
  });

  test("touching edges without covering cells is not a conflict", () => {
    const document = makeDoc(box("a", 0, 0, 3)); // covers cols 0-3, rows 0-2
    expect(zIndexForPlacement(document, at(4, 0), size(2, 2))).toBe(0);
    expect(zIndexForPlacement(document, at(0, 3), size(2, 2))).toBe(0);
  });
});
