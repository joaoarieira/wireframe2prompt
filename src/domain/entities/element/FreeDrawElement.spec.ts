import { describe, expect, test } from "vitest";
import { FreeDrawElement, freeDrawCellKey } from "./FreeDrawElement";
import { InvalidFreeDrawCellError } from "../errors/InvalidFreeDrawCellError";
import { CellChar } from "../cell-char/CellChar";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const A = CellChar.create("a");
const B = CellChar.create("b");
const pos = (col: number, row: number) => Position.create(col, row);

function emptyElement(): FreeDrawElement {
  return FreeDrawElement.create({
    id: "fd1",
    position: pos(0, 0),
    zIndex: 0,
    layerId: null,
    cells: new Map(),
  });
}

describe("FreeDrawElement", () => {
  test("creates with empty cells; size defaults to 1×1", () => {
    const el = emptyElement();
    expect(el.kind).toBe("freedraw");
    expect(el.isEmpty).toBe(true);
    expect(el.size.width).toBe(1);
    expect(el.size.height).toBe(1);
  });

  test("creates with cells; size is derived bounding box", () => {
    const cells = new Map([[freeDrawCellKey(2, 3), A]]);
    const el = FreeDrawElement.create({
      id: "fd1",
      position: pos(0, 0),
      zIndex: 0,
      layerId: null,
      cells,
    });
    expect(el.size.width).toBe(3); // 0..2 → width 3
    expect(el.size.height).toBe(4); // 0..3 → height 4
    expect(el.isEmpty).toBe(false);
  });

  test("throws InvalidFreeDrawCellError for malformed key", () => {
    expect(() =>
      FreeDrawElement.create({
        id: "fd1",
        position: pos(0, 0),
        zIndex: 0,
        layerId: null,
        cells: new Map([["1,-1", A]]),
      }),
    ).toThrow(InvalidFreeDrawCellError);

    expect(() =>
      FreeDrawElement.create({
        id: "fd1",
        position: pos(0, 0),
        zIndex: 0,
        layerId: null,
        cells: new Map([["abc", A]]),
      }),
    ).toThrow(InvalidFreeDrawCellError);

    expect(() =>
      FreeDrawElement.create({
        id: "fd1",
        position: pos(0, 0),
        zIndex: 0,
        layerId: null,
        cells: new Map([["1.5,0", A]]),
      }),
    ).toThrow(InvalidFreeDrawCellError);
  });

  test("charAt returns char at absolute position", () => {
    const cells = new Map([[freeDrawCellKey(1, 0), A]]);
    const el = FreeDrawElement.create({
      id: "fd1",
      position: pos(3, 2),
      zIndex: 0,
      layerId: null,
      cells,
    });
    expect(el.charAt(pos(4, 2))).toBe(A); // absolute (3+1, 2+0)
    expect(el.charAt(pos(3, 2))).toBeNull(); // no char at (3,2) → relative (0,0) not in cells
    expect(el.charAt(pos(1, 1))).toBeNull(); // outside → left/above
  });

  test("withCharAt adds char at absolute position inside element", () => {
    const el = emptyElement().withCharAt(pos(2, 1), A);
    expect(el.charAt(pos(2, 1))).toBe(A);
    expect(el.size.width).toBe(3); // cols 0..2
    expect(el.size.height).toBe(2); // rows 0..1
  });

  test("withCharAt shifts position when cell is above/left of origin", () => {
    const el = FreeDrawElement.create({
      id: "fd1",
      position: pos(5, 5),
      zIndex: 0,
      layerId: null,
      cells: new Map([[freeDrawCellKey(0, 0), A]]),
    });
    // Add at absolute (3, 3) — left/above the current origin (5, 5)
    const updated = el.withCharAt(pos(3, 3), B);
    expect(updated.position.col).toBe(3);
    expect(updated.position.row).toBe(3);
    expect(updated.charAt(pos(5, 5))).toBe(A); // old char still present
    expect(updated.charAt(pos(3, 3))).toBe(B); // new char present
    expect(updated.size.width).toBe(3); // cols 0..2 (relative)
    expect(updated.size.height).toBe(3); // rows 0..2 (relative)
  });

  test("withCharAt is immutable", () => {
    const el = emptyElement();
    const updated = el.withCharAt(pos(1, 1), A);
    expect(el.isEmpty).toBe(true);
    expect(updated.isEmpty).toBe(false);
  });

  test("withoutCharAt removes char", () => {
    const el = emptyElement().withCharAt(pos(0, 0), A).withCharAt(pos(1, 0), B);
    const updated = el.withoutCharAt(pos(0, 0));
    expect(updated.charAt(pos(0, 0))).toBeNull();
    expect(updated.charAt(pos(1, 0))).toBe(B);
  });

  test("withoutCharAt returns this when cell has no char", () => {
    const el = emptyElement().withCharAt(pos(1, 1), A);
    const same = el.withoutCharAt(pos(5, 5));
    expect(same).toBe(el);
  });

  test("withoutCharAt renormalizes bounding box", () => {
    // place chars at (2,2) and (4,4) relative to pos(0,0)
    const el = FreeDrawElement.create({
      id: "fd1",
      position: pos(0, 0),
      zIndex: 0,
      layerId: null,
      cells: new Map([
        [freeDrawCellKey(2, 2), A],
        [freeDrawCellKey(4, 4), B],
      ]),
    });
    // Remove the char at (2,2) absolute
    const updated = el.withoutCharAt(pos(2, 2));
    // Origin shifts to (4,4) absolute, which becomes (0,0) relative
    expect(updated.position.col).toBe(4);
    expect(updated.position.row).toBe(4);
    expect(updated.charAt(pos(4, 4))).toBe(B);
    expect(updated.size.width).toBe(1);
    expect(updated.size.height).toBe(1);
  });

  test("withoutCharAt on last cell produces empty element at original position", () => {
    const el = emptyElement().withCharAt(pos(3, 3), A);
    const updated = el.withoutCharAt(pos(3, 3));
    expect(updated.isEmpty).toBe(true);
    expect(updated.size.equals(Size.create(1, 1))).toBe(true);
  });

  test("resize is a no-op", () => {
    const el = emptyElement().withCharAt(pos(0, 0), A);
    const same = el.resize(Size.create(100, 100));
    expect(same).toBe(el);
  });

  test("moveTo (cloneWith) preserves cells", () => {
    const el = FreeDrawElement.create({
      id: "fd1",
      position: pos(1, 1),
      zIndex: 0,
      layerId: null,
      cells: new Map([[freeDrawCellKey(0, 0), A]]),
    });
    const moved = el.moveTo(pos(5, 5)) as FreeDrawElement;
    expect(moved.position.col).toBe(5);
    expect(moved.charAt(pos(5, 5))).toBe(A);
  });

  test("withKindProps always returns this", () => {
    const el = emptyElement();
    const same = el.withProps({ cells: new Map(), anything: "else" });
    expect(same).toBe(el);
  });
});
