import { describe, expect, test } from "vitest";
import { selectTool } from "./selectTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";
import { makeBox } from "../../../tests/fixtures";

const cell = Position.create(1, 1);
const noPoint = { clientX: 0, clientY: 0 };

describe("selectTool", () => {
  test("pointer down on empty space clears the selection", () => {
    const context = new FakeToolContext();

    selectTool.onCellPointerDown(context, cell, noPoint);

    expect(context.selectCalls).toEqual([null]);
    expect(context.beginMoveCalls).toEqual([]);
  });

  test("pointer down on an element selects it and starts a move drag", () => {
    const context = new FakeToolContext();
    context.hit = makeBox("b1");

    selectTool.onCellPointerDown(context, cell, noPoint);

    expect(context.selectCalls).toEqual(["b1"]);
    expect(context.beginMoveCalls).toEqual([{ elementId: "b1", cell }]);
  });

  test("pointer move forwards the cell to the drag", () => {
    const context = new FakeToolContext();
    const target = Position.create(4, 2);

    selectTool.onCellPointerMove(context, target, noPoint);

    expect(context.updateDragCalls).toEqual([target]);
  });

  test("pointer up commits the drag", () => {
    const context = new FakeToolContext();

    selectTool.onCellPointerUp(context, cell, noPoint);

    expect(context.commitDragCalls).toBe(1);
  });
});
