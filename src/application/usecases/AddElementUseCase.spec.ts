import { describe, expect, test } from "vitest";
import { AddElementUseCase } from "./AddElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("AddElementUseCase", () => {
  test("adds the element and returns a new document", () => {
    const history = new SpyHistory();
    const doc = makeDoc();
    const useCase = new AddElementUseCase(history);

    const result = useCase.execute({ document: doc, element: makeBox("a") });

    expect(result).not.toBe(doc);
    expect(result.getElement("a")).toBeDefined();
    expect(doc.elements).toHaveLength(0);
  });

  test("pushes the previous document onto history before mutating", () => {
    const history = new SpyHistory();
    const doc = makeDoc();
    const useCase = new AddElementUseCase(history);

    useCase.execute({ document: doc, element: makeBox("a") });

    expect(history.pushCalls).toEqual([doc]);
  });
});
