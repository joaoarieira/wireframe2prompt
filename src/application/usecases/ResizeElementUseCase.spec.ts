import { describe, expect, test } from "vitest";
import { ResizeElementUseCase } from "./ResizeElementUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { Position } from "../../domain/entities/position/Position";
import { Size } from "../../domain/entities/size/Size";
import { LineElement } from "../../domain/entities/element/LineElement";
import { makeBox, makeDoc } from "../../tests/fixtures";

const makeLine = () =>
  LineElement.create({
    id: "l",
    position: Position.create(0, 0),
    size: Size.create(6, 1),
    zIndex: 0,
    layerId: null,
    orientation: "h",
  });

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

  test("applies size and props in a single snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeLine());
    const useCase = new ResizeElementUseCase(history);

    const result = useCase.execute({
      document: doc,
      elementId: "l",
      size: Size.create(1, 4),
      props: { orientation: "v" },
    });

    const line = result.getElement("l") as LineElement;
    expect(line.size.equals(Size.create(1, 4))).toBe(true);
    expect(line.orientation).toBe("v");
    expect(history.pushCalls).toEqual([doc]);
  });
});
