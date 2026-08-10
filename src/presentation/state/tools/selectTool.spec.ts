import { describe, expect, test } from "vitest";
import { selectTool } from "./selectTool";
import { FakeToolContext } from "../../../tests/doubles/FakeToolContext";
import { Position } from "../../../domain/entities/position/Position";
import { makeBox, makeText } from "../../../tests/fixtures";
import { InputElement } from "../../../domain/entities/element/InputElement";
import { ButtonElement } from "../../../domain/entities/element/ButtonElement";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { Size } from "../../../domain/entities/size/Size";

const titledBase = {
  position: Position.create(0, 0),
  zIndex: 0,
  layerId: null,
  title: "Title",
};

function makeCard(size: Size): CardElement {
  return CardElement.create({ ...titledBase, id: "c1", size });
}

function makeModal(size: Size): ModalElement {
  return ModalElement.create({ ...titledBase, id: "m1", size });
}

const inputEl = InputElement.create({
  id: "in1",
  position: Position.create(0, 0),
  size: Size.create(22, 4),
  zIndex: 0,
  layerId: null,
  label: "Label",
  placeholder: "Placeholder",
  hint: "Hint",
});

const cell = Position.create(1, 1);
const noPoint = { clientX: 0, clientY: 0, button: 0, shiftKey: false };
const shiftPoint = { clientX: 0, clientY: 0, button: 0, shiftKey: true };

describe("selectTool — primary pointer down on empty space", () => {
  test("begins a marquee (no hit, no shift)", () => {
    const ctx = new FakeToolContext();

    selectTool.onCellPointerDown(ctx, cell, noPoint);

    expect(ctx.beginMarqueeCalls).toEqual([cell]);
    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginMoveCalls).toEqual([]);
  });

  test("begins a marquee with shift too (additive resolved on up)", () => {
    const ctx = new FakeToolContext();

    selectTool.onCellPointerDown(ctx, cell, shiftPoint);

    expect(ctx.beginMarqueeCalls).toEqual([cell]);
    expect(ctx.selectCalls).toEqual([]);
  });
});

describe("selectTool — primary pointer down on an element", () => {
  test("selects and begins a move when element is not in selection", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeBox("b1");

    selectTool.onCellPointerDown(ctx, cell, noPoint);

    expect(ctx.selectCalls).toEqual(["b1"]);
    expect(ctx.beginMoveCalls).toEqual([{ elementIds: ["b1"], cell }]);
  });

  test("moves the whole group when hit element is already selected", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeBox("b1");
    ctx.selectionIdsValue = ["b1", "b2"];

    selectTool.onCellPointerDown(ctx, cell, noPoint);

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginMoveCalls).toEqual([{ elementIds: ["b1", "b2"], cell }]);
  });

  test("shift+click toggles without starting a drag", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeBox("b1");

    selectTool.onCellPointerDown(ctx, cell, shiftPoint);

    expect(ctx.toggleSelectCalls).toEqual(["b1"]);
    expect(ctx.beginMoveCalls).toEqual([]);
    expect(ctx.selectCalls).toEqual([]);
  });
});

describe("selectTool — pointer move and up", () => {
  test("pointer move updates both drag and marquee (both no-op-safe)", () => {
    const ctx = new FakeToolContext();
    const target = Position.create(4, 2);

    selectTool.onCellPointerMove(ctx, target, noPoint);

    expect(ctx.updateDragCalls).toEqual([target]);
    expect(ctx.updateMarqueeCalls).toEqual([target]);
  });

  test("pointer up commits drag and marquee with shiftKey flag", () => {
    const ctx = new FakeToolContext();

    selectTool.onCellPointerUp(ctx, cell, shiftPoint);

    expect(ctx.commitDragCalls).toBe(1);
    expect(ctx.commitMarqueeCalls).toEqual([true]);
  });

  test("pointer up without shift passes false to commitMarquee", () => {
    const ctx = new FakeToolContext();

    selectTool.onCellPointerUp(ctx, cell, noPoint);

    expect(ctx.commitMarqueeCalls).toEqual([false]);
  });
});

describe("selectTool — double click", () => {
  test("double click on a text element selects it and starts canvas editing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeText("t1", "hello");

    selectTool.onCellDoubleClick!(ctx, cell);

    expect(ctx.selectCalls).toEqual(["t1"]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual(["t1"]);
  });

  test("double click on a button selects it and starts canvas editing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = ButtonElement.create({
      id: "btn1",
      position: Position.create(0, 0),
      size: Size.create(8, 3),
      zIndex: 0,
      layerId: null,
      text: "Text",
    });

    selectTool.onCellDoubleClick!(ctx, cell);

    expect(ctx.selectCalls).toEqual(["btn1"]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual(["btn1"]);
  });

  test("double click on a non-text element does nothing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeBox("b1");

    selectTool.onCellDoubleClick!(ctx, cell);

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual([]);
  });

  test("double click on empty space does nothing", () => {
    const ctx = new FakeToolContext();

    selectTool.onCellDoubleClick!(ctx, cell);

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual([]);
  });

  test.each([
    [Position.create(5, 0), "label"],
    [Position.create(5, 1), "placeholder"],
    [Position.create(5, 3), "hint"],
  ] as const)(
    "double click on a field element at %o edits its %s slot",
    (target, field) => {
      const ctx = new FakeToolContext();
      ctx.hit = inputEl;

      selectTool.onCellDoubleClick!(ctx, target);

      expect(ctx.selectCalls).toEqual(["in1"]);
      expect(ctx.beginCanvasFieldEditingCalls).toEqual([
        { elementId: "in1", field },
      ]);
    },
  );

  test.each([
    ["card", makeCard(Size.create(12, 6))],
    ["modal", makeModal(Size.create(12, 6))],
  ] as const)(
    "double click on a %s's title row selects it and starts canvas editing",
    (_kind, element) => {
      const ctx = new FakeToolContext();
      ctx.hit = element;

      selectTool.onCellDoubleClick!(ctx, Position.create(4, 1));

      expect(ctx.selectCalls).toEqual([element.id]);
      expect(ctx.beginCanvasInlineEditingCalls).toEqual([element.id]);
    },
  );

  test("double click on a card's body does nothing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeCard(Size.create(12, 6));

    selectTool.onCellDoubleClick!(ctx, Position.create(4, 3));

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual([]);
  });

  test("double click on a card too short to show a title does nothing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = makeCard(Size.create(12, 2));

    selectTool.onCellDoubleClick!(ctx, Position.create(4, 1));

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginCanvasInlineEditingCalls).toEqual([]);
  });

  test("double click on a field element's borderless gap does nothing", () => {
    const ctx = new FakeToolContext();
    ctx.hit = inputEl;

    // Row 2 is the bottom border — no editable slot there.
    selectTool.onCellDoubleClick!(ctx, Position.create(5, 2));

    expect(ctx.selectCalls).toEqual([]);
    expect(ctx.beginCanvasFieldEditingCalls).toEqual([]);
  });
});
