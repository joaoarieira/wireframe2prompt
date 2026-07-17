import { describe, expect, test } from "vitest";
import { pencilTool } from "./pencilTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(3, 2);
const noPoint = { clientX: 0, clientY: 0 };

describe("pencilTool", () => {
  test("pointer down begins a draw stroke at the cell", () => {
    const context = new FakeToolContext();

    pencilTool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginDrawStrokeCalls).toEqual([cell]);
  });

  test("pointer move extends the stroke", () => {
    const context = new FakeToolContext();
    const next = Position.create(4, 2);

    pencilTool.onCellPointerMove(context, next, noPoint);

    expect(context.extendStrokeCalls).toEqual([next]);
  });

  test("pointer up commits the stroke", () => {
    const context = new FakeToolContext();

    pencilTool.onCellPointerUp(context, cell, noPoint);

    expect(context.commitStrokeCalls).toBe(1);
  });
});
