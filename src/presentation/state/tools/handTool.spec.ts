import { describe, expect, test } from "vitest";
import { handTool } from "./handTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";

const cell = Position.create(0, 0);

describe("handTool", () => {
  test("pointer down begins a pan at the surface point", () => {
    const context = new FakeToolContext();
    const point = { clientX: 100, clientY: 200 };

    handTool.onCellPointerDown(context, cell, point);

    expect(context.beginPanCalls).toEqual([point]);
  });

  test("pointer move updates the pan", () => {
    const context = new FakeToolContext();
    const point = { clientX: 120, clientY: 210 };

    handTool.onCellPointerMove(context, cell, point);

    expect(context.updatePanCalls).toEqual([point]);
  });

  test("pointer up ends the pan", () => {
    const context = new FakeToolContext();

    handTool.onCellPointerUp(context, cell, { clientX: 0, clientY: 0 });

    expect(context.endPanCalls).toBe(1);
  });
});
