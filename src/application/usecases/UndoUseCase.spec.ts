import { describe, expect, test } from "vitest";
import { UndoUseCase } from "./UndoUseCase";
import { AddElementUseCase } from "./AddElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("UndoUseCase", () => {
  test("restores the snapshot taken before the previous mutation", () => {
    const history = new SpyHistory();
    const original = makeDoc();

    const mutated = new AddElementUseCase(history).execute({
      document: original,
      element: makeBox("a"),
    });
    expect(mutated.getElement("a")).toBeDefined();

    const restored = new UndoUseCase(history).execute({ document: mutated });

    expect(restored).toBe(original);
    expect(restored.getElement("a")).toBeUndefined();
    expect(history.canRedo).toBe(true);
  });

  test("returns the current document unchanged when there is nothing to undo", () => {
    const history = new SpyHistory();
    const doc = makeDoc();

    const result = new UndoUseCase(history).execute({ document: doc });

    expect(result).toBe(doc);
  });
});
