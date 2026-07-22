import { describe, expect, test } from "vitest";
import {
  LINE_FLIP_THRESHOLD,
  arrowDirectionForDrag,
  arrowOrientationOf,
  cellSpanRect,
  lineOrientationForDrag,
  lineSizeForOrientation,
} from "./dragGeometry";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const at = (col: number, row: number) => Position.create(col, row);

describe("cellSpanRect", () => {
  test("no drag keeps a 1x1 rect on the anchor cell", () => {
    const rect = cellSpanRect(at(2, 3), at(2, 3));
    expect(rect.position.equals(at(2, 3))).toBe(true);
    expect(rect.size.equals(Size.create(1, 1))).toBe(true);
  });

  test("dragging 5 cells each way yields an inclusive 5x5 rect", () => {
    const rect = cellSpanRect(at(0, 0), at(4, 4));
    expect(rect.position.equals(at(0, 0))).toBe(true);
    expect(rect.size.equals(Size.create(5, 5))).toBe(true);
  });

  test("dragging up/left of the anchor moves the rect to the min corner", () => {
    const rect = cellSpanRect(at(5, 5), at(2, 1));
    expect(rect.position.equals(at(2, 1))).toBe(true);
    expect(rect.size.equals(Size.create(4, 5))).toBe(true);
  });
});

describe("arrowOrientationOf", () => {
  test("left/right arrows lie on the horizontal axis", () => {
    expect(arrowOrientationOf("left")).toBe("h");
    expect(arrowOrientationOf("right")).toBe("h");
  });

  test("up/down arrows lie on the vertical axis", () => {
    expect(arrowOrientationOf("up")).toBe("v");
    expect(arrowOrientationOf("down")).toBe("v");
  });
});

describe("arrowDirectionForDrag", () => {
  test("horizontal axis points left on a negative column delta", () => {
    expect(arrowDirectionForDrag("h", -3, 0)).toBe("left");
  });

  test("horizontal axis points right on a positive or zero column delta", () => {
    expect(arrowDirectionForDrag("h", 3, 0)).toBe("right");
    expect(arrowDirectionForDrag("h", 0, 1)).toBe("right");
  });

  test("vertical axis points up on a negative row delta", () => {
    expect(arrowDirectionForDrag("v", 0, -2)).toBe("up");
  });

  test("vertical axis points down on a positive or zero row delta", () => {
    expect(arrowDirectionForDrag("v", 0, 2)).toBe("down");
    expect(arrowDirectionForDrag("v", 1, 0)).toBe("down");
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
