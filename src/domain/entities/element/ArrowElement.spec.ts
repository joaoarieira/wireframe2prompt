import { describe, expect, test } from "vitest";
import { ArrowElement } from "./ArrowElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "a1",
  position: Position.create(0, 0),
  size: Size.create(4, 1),
  zIndex: 0,
  layerId: null,
};

describe("ArrowElement", () => {
  test("creates with direction", () => {
    const arrow = ArrowElement.create({ ...base, direction: "right" });
    expect(arrow.kind).toBe("arrow");
    expect(arrow.direction).toBe("right");
    expect(arrow.id).toBe("a1");
  });

  test("withDirection returns new instance with new direction", () => {
    const arrow = ArrowElement.create({ ...base, direction: "right" });
    const updated = arrow.withDirection("left");
    expect(updated.direction).toBe("left");
    expect(arrow.direction).toBe("right");
  });

  test("withKindProps accepts all valid directions", () => {
    const arrow = ArrowElement.create({ ...base, direction: "right" });
    expect(
      (arrow.withProps({ direction: "left" }) as ArrowElement).direction,
    ).toBe("left");
    expect(
      (arrow.withProps({ direction: "up" }) as ArrowElement).direction,
    ).toBe("up");
    expect(
      (arrow.withProps({ direction: "down" }) as ArrowElement).direction,
    ).toBe("down");
    expect(
      (arrow.withProps({ direction: "right" }) as ArrowElement).direction,
    ).toBe("right");
  });

  test("withKindProps ignores invalid direction", () => {
    const arrow = ArrowElement.create({ ...base, direction: "right" });
    const updated = arrow.withProps({ direction: "diagonal" });
    expect((updated as ArrowElement).direction).toBe("right");
  });

  test("cloneWith (via moveTo) preserves direction", () => {
    const arrow = ArrowElement.create({ ...base, direction: "down" });
    const moved = arrow.moveTo(Position.create(2, 3)) as ArrowElement;
    expect(moved.direction).toBe("down");
    expect(moved.position.col).toBe(2);
    expect(moved.position.row).toBe(3);
  });

  test("withName preserves direction", () => {
    const arrow = ArrowElement.create({ ...base, direction: "up" });
    const named = arrow.withProps({ name: "main arrow" }) as ArrowElement;
    expect(named.direction).toBe("up");
    expect(named.name).toBe("main arrow");
  });
});
