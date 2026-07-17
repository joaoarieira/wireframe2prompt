import { describe, expect, test } from "vitest";
import { eraserTool } from "./eraserTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(3, 2);
const noPoint = { clientX: 0, clientY: 0 };

describe("eraserTool", () => {
  test("pointer down begins an erase stroke at the cell", () => {
    const context = new FakeToolContext();

    eraserTool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginEraseStrokeCalls).toEqual([cell]);
  });

  test("pointer move extends the stroke", () => {
    const context = new FakeToolContext();
    const next = Position.create(4, 2);

    eraserTool.onCellPointerMove(context, next, noPoint);

    expect(context.extendStrokeCalls).toEqual([next]);
  });

  test("pointer up commits the stroke", () => {
    const context = new FakeToolContext();

    eraserTool.onCellPointerUp(context, cell, noPoint);

    expect(context.commitStrokeCalls).toBe(1);
  });
});
