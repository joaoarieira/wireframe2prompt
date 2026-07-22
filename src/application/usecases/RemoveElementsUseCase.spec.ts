import { describe, expect, test } from "vitest";
import { RemoveElementsUseCase } from "./RemoveElementsUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";

describe("RemoveElementsUseCase", () => {
  test("empty list returns document unchanged without a push", () => {
    const history = new SpyHistory();
    const uc = new RemoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = uc.execute({ document: doc, elementIds: [] });

    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("removes two elements and pushes exactly one snapshot", () => {
    const history = new SpyHistory();
    const uc = new RemoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));

    const result = uc.execute({ document: doc, elementIds: ["b1", "b2"] });

    expect(history.pushCalls).toHaveLength(1);
    expect(result.elements).toHaveLength(0);
  });

  test("single element removal works like RemoveElementUseCase", () => {
    const history = new SpyHistory();
    const uc = new RemoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = uc.execute({ document: doc, elementIds: ["b1"] });

    expect(history.pushCalls).toHaveLength(1);
    expect(result.elements).toHaveLength(0);
  });

  test("unknown elementId propagates the domain error", () => {
    const history = new SpyHistory();
    const uc = new RemoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    expect(() => uc.execute({ document: doc, elementIds: ["ghost"] })).toThrow(
      ElementNotFoundError,
    );
  });

  test("one undo restores both elements after removing two", () => {
    const history = new SpyHistory();
    const uc = new RemoveElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));

    const removed = uc.execute({ document: doc, elementIds: ["b1", "b2"] });

    const restored = history.undo(removed)!;
    expect(restored.elements).toHaveLength(2);
  });
});
