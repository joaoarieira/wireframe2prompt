import { describe, expect, test } from "vitest";
import { ResizeElementUseCase } from "./ResizeElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { Size } from "../../domain/entities/size/Size";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("ResizeElementUseCase", () => {
  test("resizes the element and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeBox("a"));
    const useCase = new ResizeElementUseCase(history);

    const result = useCase.execute({
      document: doc,
      elementId: "a",
      size: Size.create(8, 4),
    });

    expect(result.getElement("a")!.size.equals(Size.create(8, 4))).toBe(true);
    expect(history.pushCalls).toEqual([doc]);
  });
});
