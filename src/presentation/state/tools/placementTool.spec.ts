import { describe, expect, test } from "vitest";
import { createPlacementTool } from "./placementTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(2, 3);

describe("createPlacementTool", () => {
  test("carries the kind and label key it was created with", () => {
    const tool = createPlacementTool("line", "tools.line");

    expect(tool.id).toBe("line");
    expect(tool.labelKey).toBe("tools.line");
  });

  test("pointer down places an element of its kind at the cell", () => {
    const tool = createPlacementTool("box", "tools.box");
    const context = new FakeToolContext();

    tool.onCellPointerDown(context, cell);

    expect(context.placeCalls).toEqual([{ kind: "box", cell }]);
  });

  test("pointer move and up are no-ops", () => {
    const tool = createPlacementTool("text", "tools.text");
    const context = new FakeToolContext();

    tool.onCellPointerMove(context, cell);
    tool.onCellPointerUp(context, cell);

    expect(context.placeCalls).toEqual([]);
    expect(context.updateDragCalls).toEqual([]);
    expect(context.commitDragCalls).toBe(0);
  });
});
