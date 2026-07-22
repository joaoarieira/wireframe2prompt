import { describe, expect, test } from "vitest";
import { createPlacementTool } from "./placementTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";
import { makeBox, makeText } from "../../../tests/fixtures";

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

  test("text tool on an existing text opens it for inline editing", () => {
    const tool = createPlacementTool("text", "tools.text");
    const context = new FakeToolContext();
    context.hit = makeText("t1", "Hello");

    tool.onCellPointerDown(context, cell, noPoint);

    expect(context.selectCalls).toEqual(["t1"]);
    expect(context.beginCanvasInlineEditingCalls).toEqual(["t1"]);
    expect(context.beginPlacementCalls).toEqual([]);
  });

  test("text tool on a non-text element still places a new text", () => {
    const tool = createPlacementTool("text", "tools.text");
    const context = new FakeToolContext();
    context.hit = makeBox("b1");

    tool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginCanvasInlineEditingCalls).toEqual([]);
    expect(context.beginPlacementCalls).toEqual([{ kind: "text", cell }]);
  });

  test("text tool on empty space places a new text", () => {
    const tool = createPlacementTool("text", "tools.text");
    const context = new FakeToolContext();

    tool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginCanvasInlineEditingCalls).toEqual([]);
    expect(context.beginPlacementCalls).toEqual([{ kind: "text", cell }]);
  });

  test("a non-text tool over a text element still places, never edits", () => {
    const tool = createPlacementTool("box", "tools.box");
    const context = new FakeToolContext();
    context.hit = makeText("t1", "Hello");

    tool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginCanvasInlineEditingCalls).toEqual([]);
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
