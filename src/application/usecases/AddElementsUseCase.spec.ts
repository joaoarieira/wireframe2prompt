import { describe, expect, test } from "vitest";
import { AddElementsUseCase } from "./AddElementsUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("AddElementsUseCase", () => {
  test("adds all elements and pushes exactly one history snapshot", () => {
    const history = new SpyHistory();
    const useCase = new AddElementsUseCase(history);
    const doc = makeDoc();
    const b1 = makeBox("b1");
    const b2 = makeBox("b2");

    const result = useCase.execute({ document: doc, elements: [b1, b2] });

    expect(result.elements).toHaveLength(2);
    expect(result.getElement("b1")).toBeDefined();
    expect(result.getElement("b2")).toBeDefined();
    expect(history.pushCalls).toHaveLength(1);
    expect(history.pushCalls[0]).toBe(doc);
  });

  test("empty list is a no-op — returns the same document, no push", () => {
    const history = new SpyHistory();
    const useCase = new AddElementsUseCase(history);
    const doc = makeDoc(makeBox("b1"));

    const result = useCase.execute({ document: doc, elements: [] });

    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("original document is not mutated", () => {
    const history = new SpyHistory();
    const useCase = new AddElementsUseCase(history);
    const doc = makeDoc();

    useCase.execute({ document: doc, elements: [makeBox("b1")] });

    expect(doc.elements).toHaveLength(0);
  });
});
