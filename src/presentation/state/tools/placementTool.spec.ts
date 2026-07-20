import { describe, expect, test } from "vitest";
import { createPlacementTool } from "./placementTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(2, 3);
const noPoint = { clientX: 0, clientY: 0, button: 0, shiftKey: false };

describe("createPlacementTool", () => {
  test("carries the kind and label key it was created with", () => {
    const tool = createPlacementTool("line", "tools.line");

    expect(tool.id).toBe("line");
    expect(tool.labelKey).toBe("tools.line");
  });

  test("pointer down anchors a placement drag of its kind at the cell", () => {
    const tool = createPlacementTool("box", "tools.box");
    const context = new FakeToolContext();

    tool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginPlacementCalls).toEqual([{ kind: "box", cell }]);
  });

  test("pointer move sizes the drag and pointer up commits it", () => {
    const tool = createPlacementTool("text", "tools.text");
    const context = new FakeToolContext();

    tool.onCellPointerMove(context, cell, noPoint);
    tool.onCellPointerUp(context, cell, noPoint);

    expect(context.beginPlacementCalls).toEqual([]);
    expect(context.updateDragCalls).toEqual([cell]);
    expect(context.commitDragCalls).toBe(1);
  });

  test("pointer move also parks a placement hover ghost of its kind", () => {
    const tool = createPlacementTool("box", "tools.box");
    const context = new FakeToolContext();

    tool.onCellPointerMove(context, cell, noPoint);

    expect(context.previewPlacementHoverCalls).toEqual([{ kind: "box", cell }]);
  });
});
