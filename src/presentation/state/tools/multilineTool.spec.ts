import { describe, expect, test } from "vitest";
import { multilineTool } from "./multilineTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(3, 2);
const noPoint = { clientX: 0, clientY: 0, button: 0, shiftKey: false };

describe("multilineTool", () => {
  test("exposes its id and label key", () => {
    expect(multilineTool.id).toBe("multiline");
    expect(multilineTool.labelKey).toBe("tools.multiline");
  });

  test("pointer down begins a multiline at the cell", () => {
    const context = new FakeToolContext();

    multilineTool.onCellPointerDown(context, cell, noPoint);

    expect(context.beginMultilineCalls).toEqual([cell]);
  });

  test("pointer move extends the multiline", () => {
    const context = new FakeToolContext();
    const next = Position.create(6, 2);

    multilineTool.onCellPointerMove(context, next, noPoint);

    expect(context.extendMultilineCalls).toEqual([next]);
  });

  test("pointer up commits the multiline", () => {
    const context = new FakeToolContext();

    multilineTool.onCellPointerUp(context, cell, noPoint);

    expect(context.commitMultilineCalls).toBe(1);
  });
});
