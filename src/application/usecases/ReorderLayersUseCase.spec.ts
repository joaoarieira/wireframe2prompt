import { describe, expect, test } from "vitest";
import { ReorderLayersUseCase } from "./ReorderLayersUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";

describe("ReorderLayersUseCase", () => {
  test("empty list returns document unchanged without a push", () => {
    const history = new SpyHistory();
    const uc = new ReorderLayersUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = uc.execute({ document: doc, reorders: [] });

    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("reorders two elements and pushes exactly one snapshot", () => {
    const history = new SpyHistory();
    const uc = new ReorderLayersUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));

    const result = uc.execute({
      document: doc,
      reorders: [
        { elementId: "b1", zIndex: 5 },
        { elementId: "b2", zIndex: 8 },
      ],
    });

    expect(history.pushCalls).toHaveLength(1);
    expect(result.getElement("b1")?.zIndex).toBe(5);
    expect(result.getElement("b2")?.zIndex).toBe(8);
  });

  test("unknown elementId propagates the domain error", () => {
    const history = new SpyHistory();
    const uc = new ReorderLayersUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    expect(() =>
      uc.execute({
        document: doc,
        reorders: [{ elementId: "ghost", zIndex: 1 }],
      }),
    ).toThrow(ElementNotFoundError);
  });

  test("one undo restores both z-indices after reordering two", () => {
    const history = new SpyHistory();
    const uc = new ReorderLayersUseCase(history);
    const doc = makeDoc(makeBox("b1"), makeBox("b2"));
    const originalZ1 = doc.getElement("b1")!.zIndex;
    const originalZ2 = doc.getElement("b2")!.zIndex;

    const reordered = uc.execute({
      document: doc,
      reorders: [
        { elementId: "b1", zIndex: 5 },
        { elementId: "b2", zIndex: 8 },
      ],
    });

    const restored = history.undo(reordered)!;
    expect(restored.getElement("b1")?.zIndex).toBe(originalZ1);
    expect(restored.getElement("b2")?.zIndex).toBe(originalZ2);
  });
});
