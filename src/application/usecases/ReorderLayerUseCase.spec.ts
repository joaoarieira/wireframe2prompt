import { describe, expect, test } from "vitest";
import { ReorderLayerUseCase } from "./ReorderLayerUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("ReorderLayerUseCase", () => {
  test("changes the element z-index and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeBox("a", 0));
    const useCase = new ReorderLayerUseCase(history);

    const result = useCase.execute({
      document: doc,
      elementId: "a",
      zIndex: 9,
    });

    expect(result.getElement("a")!.zIndex).toBe(9);
    expect(doc.getElement("a")!.zIndex).toBe(0);
    expect(history.pushCalls).toEqual([doc]);
  });
});
