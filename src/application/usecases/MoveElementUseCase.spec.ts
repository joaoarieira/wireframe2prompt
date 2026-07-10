import { describe, expect, test } from "vitest";
import { MoveElementUseCase } from "./MoveElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { Position } from "../../domain/entities/position/Position";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("MoveElementUseCase", () => {
  test("moves the element and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeBox("a"));
    const useCase = new MoveElementUseCase(history);

    const result = useCase.execute({
      document: doc,
      elementId: "a",
      position: Position.create(5, 6),
    });

    expect(result.getElement("a")!.position.equals(Position.create(5, 6))).toBe(
      true,
    );
    expect(doc.getElement("a")!.position.equals(Position.create(0, 0))).toBe(
      true,
    );
    expect(history.pushCalls).toEqual([doc]);
  });
});
