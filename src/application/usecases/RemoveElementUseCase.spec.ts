import { describe, expect, test } from "vitest";
import { RemoveElementUseCase } from "./RemoveElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("RemoveElementUseCase", () => {
  test("removes the element and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeBox("a"), makeBox("b"));
    const useCase = new RemoveElementUseCase(history);

    const result = useCase.execute({ document: doc, elementId: "a" });

    expect(result.getElement("a")).toBeUndefined();
    expect(result.getElement("b")).toBeDefined();
    expect(doc.getElement("a")).toBeDefined();
    expect(history.pushCalls).toEqual([doc]);
  });
});
