import { describe, expect, test, beforeEach } from "vitest";
import {
  DrawFreeCharUseCase,
  drawCellsOnDocument,
} from "./DrawFreeCharUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import {
  FreeDrawElement,
  freeDrawCellKey,
} from "../../domain/entities/element/FreeDrawElement";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";
import { InvalidFreeDrawTargetError } from "../../domain/entities/errors/InvalidFreeDrawTargetError";
import { BoxElement } from "../../domain/entities/element/BoxElement";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { Position } from "../../domain/entities/position/Position";
import { Size } from "../../domain/entities/size/Size";
import type { Element } from "../../domain/entities/element/Element";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";

const A = CellChar.create("a");
const pos = (col: number, row: number) => Position.create(col, row);

function makeFDElement(id = "fd1"): FreeDrawElement {
  return FreeDrawElement.create({
    id,
    position: pos(0, 0),
    zIndex: 0,
    layerId: null,
    cells: new Map(),
  });
}

function makeDoc(elements: readonly Element[] = []) {
  return WireframeDocument.create({
    id: "doc1",
    name: "Test",
    gridSize: GridSize.create(20, 10),
    elements,
  });
}

let history: SpyHistory;
let useCase: DrawFreeCharUseCase;

beforeEach(() => {
  history = new SpyHistory();
  useCase = new DrawFreeCharUseCase(history);
});

describe("DrawFreeCharUseCase", () => {
  test("throws ElementNotFoundError if element id does not exist", () => {
    const doc = makeDoc();
    expect(() =>
      useCase.execute({ document: doc, elementId: "ghost", cells: [] }),
    ).toThrow(ElementNotFoundError);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("throws InvalidFreeDrawTargetError if element is not freedraw", () => {
    const box = BoxElement.create({
      id: "b1",
      position: pos(0, 0),
      size: Size.create(4, 2),
      zIndex: 0,
      layerId: null,
    });
    const doc = makeDoc([box]);
    expect(() =>
      useCase.execute({ document: doc, elementId: "b1", cells: [] }),
    ).toThrow(InvalidFreeDrawTargetError);
  });

  test("returns document unchanged and does NOT push when cells is empty", () => {
    const fd = makeFDElement();
    const doc = makeDoc([fd]);
    const result = useCase.execute({
      document: doc,
      elementId: "fd1",
      cells: [],
    });
    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("pushes snapshot and applies cells when cells is non-empty", () => {
    const fd = makeFDElement();
    const doc = makeDoc([fd]);
    const cells = [{ position: pos(2, 3), char: A }];
    const result = useCase.execute({ document: doc, elementId: "fd1", cells });
    expect(history.pushCalls).toHaveLength(1);
    expect(history.pushCalls[0]).toBe(doc);
    const updated = result.getElement("fd1") as FreeDrawElement;
    expect(updated.charAt(pos(2, 3))).toBe(A);
  });

  test("applies multiple cells in sequence", () => {
    const fd = makeFDElement();
    const doc = makeDoc([fd]);
    const B = CellChar.create("b");
    const cells = [
      { position: pos(1, 0), char: A },
      { position: pos(2, 0), char: B },
    ];
    const result = useCase.execute({ document: doc, elementId: "fd1", cells });
    const updated = result.getElement("fd1") as FreeDrawElement;
    expect(updated.charAt(pos(1, 0))).toBe(A);
    expect(updated.charAt(pos(2, 0))).toBe(B);
  });
});

describe("drawCellsOnDocument (pure helper)", () => {
  test("throws ElementNotFoundError for missing element", () => {
    const doc = makeDoc();
    expect(() =>
      drawCellsOnDocument(doc, "ghost", [{ position: pos(0, 0), char: A }]),
    ).toThrow(ElementNotFoundError);
  });

  test("throws InvalidFreeDrawTargetError for non-freedraw element", () => {
    const box = BoxElement.create({
      id: "b1",
      position: pos(0, 0),
      size: Size.create(4, 2),
      zIndex: 0,
      layerId: null,
    });
    expect(() =>
      drawCellsOnDocument(makeDoc([box]), "b1", [
        { position: pos(0, 0), char: A },
      ]),
    ).toThrow(InvalidFreeDrawTargetError);
  });

  test("applies cells to the element", () => {
    const fd = FreeDrawElement.create({
      id: "fd1",
      position: pos(5, 5),
      zIndex: 0,
      layerId: null,
      cells: new Map([[freeDrawCellKey(0, 0), A]]),
    });
    const doc = makeDoc([fd]);
    const B = CellChar.create("b");
    const result = drawCellsOnDocument(doc, "fd1", [
      { position: pos(6, 5), char: B },
    ]);
    const updated = result.getElement("fd1") as FreeDrawElement;
    expect(updated.charAt(pos(5, 5))).toBe(A);
    expect(updated.charAt(pos(6, 5))).toBe(B);
  });
});
