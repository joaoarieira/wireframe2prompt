import { describe, expect, test } from "vitest";
import { MoveElementsUseCase } from "./MoveElementsUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";
import { Position } from "../../domain/entities/position/Position";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";

const pos = (col: number, row: number) => Position.create(col, row);

describe("MoveElementsUseCase", () => {
  test("empty list returns document unchanged without a push", () => {
    const history = new SpyHistory();
    const uc = new MoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = uc.execute({ document: doc, moves: [] });

    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("moves two elements and pushes exactly one snapshot", () => {
    const history = new SpyHistory();
    const uc = new MoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));

    const result = uc.execute({
      document: doc,
      moves: [
        { elementId: "b1", position: pos(3, 3) },
        { elementId: "b2", position: pos(7, 7) },
      ],
    });

    expect(history.pushCalls).toHaveLength(1);
    expect(result.getElement("b1")?.position.equals(pos(3, 3))).toBe(true);
    expect(result.getElement("b2")?.position.equals(pos(7, 7))).toBe(true);
  });

  test("single element move works like MoveElementUseCase", () => {
    const history = new SpyHistory();
    const uc = new MoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = uc.execute({
      document: doc,
      moves: [{ elementId: "b1", position: pos(5, 2) }],
    });

    expect(history.pushCalls).toHaveLength(1);
    expect(result.getElement("b1")?.position.equals(pos(5, 2))).toBe(true);
  });

  test("unknown elementId propagates the domain error", () => {
    const history = new SpyHistory();
    const uc = new MoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    expect(() =>
      uc.execute({ document: doc, moves: [{ elementId: "ghost", position: pos(0, 0) }] }),
    ).toThrow(ElementNotFoundError);
  });

  test("one undo restores both elements after moving two", () => {
    const history = new SpyHistory();
    const uc = new MoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));

    const moved = uc.execute({
      document: doc,
      moves: [
        { elementId: "b1", position: pos(3, 3) },
        { elementId: "b2", position: pos(7, 7) },
      ],
    });

    const restored = history.undo(moved)!;
    expect(restored.getElement("b1")?.position.equals(pos(0, 0))).toBe(true);
    expect(restored.getElement("b2")?.position.equals(pos(0, 0))).toBe(true);
  });
});
