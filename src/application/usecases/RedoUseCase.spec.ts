import { describe, expect, test } from "vitest";
import { RedoUseCase } from "./RedoUseCase";
import { UndoUseCase } from "./UndoUseCase";
import { AddElementUseCase } from "./AddElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("RedoUseCase", () => {
  test("re-applies a mutation that was undone", () => {
    const history = new SpyHistory();
    const original = makeDoc();

    const mutated = new AddElementUseCase(history).execute({
      document: original,
      element: makeBox("a"),
    });
    const restored = new UndoUseCase(history).execute({ document: mutated });
    expect(restored).toBe(original);

    const redone = new RedoUseCase(history).execute({ document: restored });

    expect(redone).toBe(mutated);
    expect(redone.getElement("a")).toBeDefined();
  });

  test("returns the current document unchanged when there is nothing to redo", () => {
    const history = new SpyHistory();
    const doc = makeDoc();

    const result = new RedoUseCase(history).execute({ document: doc });

    expect(result).toBe(doc);
  });
});
