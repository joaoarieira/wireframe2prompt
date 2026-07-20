import { describe, expect, test } from "vitest";
import { ResizeGridUseCase } from "./ResizeGridUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { makeBox, makeDoc } from "../../tests/fixtures";

describe("ResizeGridUseCase", () => {
  test("resizes the grid and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeBox("a"));
    const useCase = new ResizeGridUseCase(history);

    const result = useCase.execute({
      document: doc,
      gridSize: GridSize.create(40, 12),
    });

    expect(result.gridSize.equals(GridSize.create(40, 12))).toBe(true);
    expect(result.getElement("a")).toBeDefined();
    expect(history.pushCalls).toEqual([doc]);
  });
});
