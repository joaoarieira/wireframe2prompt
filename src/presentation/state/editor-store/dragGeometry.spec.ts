import { describe, expect, test } from "vitest";
import {
  LINE_FLIP_THRESHOLD,
  lineOrientationForDrag,
  lineSizeForOrientation,
  placementDragSize,
} from "./dragGeometry";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const at = (col: number, row: number) => Position.create(col, row);

describe("placementDragSize", () => {
  test("no drag keeps a 1×1 box on the anchor cell", () => {
    expect(
      placementDragSize(at(2, 3), at(2, 3)).equals(Size.create(1, 1)),
    ).toBe(true);
  });

  test("dragging 5 cells each way yields an inclusive 5×5 box", () => {
    expect(
      placementDragSize(at(0, 0), at(4, 4)).equals(Size.create(5, 5)),
    ).toBe(true);
  });

  test("dragging up/left of the anchor clamps at 1", () => {
    expect(
      placementDragSize(at(5, 5), at(2, 1)).equals(Size.create(1, 1)),
    ).toBe(true);
  });
});

describe("lineOrientationForDrag", () => {
  test("threshold constant is two cells", () => {
    expect(LINE_FLIP_THRESHOLD).toBe(2);
  });

  test("horizontal stays horizontal below the threshold", () => {
    expect(lineOrientationForDrag("h", 0, 1)).toBe("h");
  });

  test("horizontal flips to vertical at the threshold", () => {
    expect(lineOrientationForDrag("h", 0, 2)).toBe("v");
  });

  test("a tie between the axes keeps horizontal", () => {
    expect(lineOrientationForDrag("h", 3, 3)).toBe("h");
  });

  test("vertical flips to horizontal when dragged sideways", () => {
    expect(lineOrientationForDrag("v", 4, 0)).toBe("h");
  });

  test("vertical stays vertical below the threshold", () => {
    expect(lineOrientationForDrag("v", 1, 0)).toBe("v");
  });

  test("a tie between the axes keeps vertical", () => {
    expect(lineOrientationForDrag("v", 3, 3)).toBe("v");
  });
});

describe("lineSizeForOrientation", () => {
  test("horizontal collapses the height to 1", () => {
    expect(
      lineSizeForOrientation("h", Size.create(6, 4)).equals(Size.create(6, 1)),
    ).toBe(true);
  });

  test("vertical collapses the width to 1", () => {
    expect(
      lineSizeForOrientation("v", Size.create(6, 4)).equals(Size.create(1, 4)),
    ).toBe(true);
  });
});
