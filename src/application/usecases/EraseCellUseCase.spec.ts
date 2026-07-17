import { describe, expect, test, beforeEach } from "vitest";
import { EraseCellUseCase, eraseCellsOnDocument } from "./EraseCellUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { FreeDrawElement, freeDrawCellKey } from "../../domain/entities/element/FreeDrawElement";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { Position } from "../../domain/entities/position/Position";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";

const A = CellChar.create("a");
const B = CellChar.create("b");
const pos = (col: number, row: number) => Position.create(col, row);

function fdElement(id: string, position: Position, cells: Map<string, CellChar>, zIndex = 0): FreeDrawElement {
  return FreeDrawElement.create({ id, position, zIndex, layerId: null, cells });
}

function makeDoc(...elements: FreeDrawElement[]) {
  return WireframeDocument.create({
    id: "doc1",
    name: "Test",
    gridSize: GridSize.create(20, 10),
    elements,
  });
}

let history: SpyHistory;
let useCase: EraseCellUseCase;

beforeEach(() => {
  history = new SpyHistory();
  useCase = new EraseCellUseCase(history);
});

describe("EraseCellUseCase", () => {
  test("does NOT push and returns same doc when no cells erased", () => {
    const fd = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]));
    const doc = makeDoc(fd);
    const result = useCase.execute({ document: doc, cells: [pos(5, 5)] });
    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });

  test("erases a char from the highest z-index freedraw element", () => {
    const fd = fdElement(
      "fd1",
      pos(0, 0),
      new Map([
        [freeDrawCellKey(0, 0), A],
        [freeDrawCellKey(1, 0), B],
      ]),
    );
    const doc = makeDoc(fd);
    const result = useCase.execute({ document: doc, cells: [pos(0, 0)] });
    expect(history.pushCalls).toHaveLength(1);
    // Element renormalizes: position shifts to (1,0), B is now at relative (0,0).
    const updated = result.getElement("fd1") as FreeDrawElement;
    expect(updated.charAt(pos(0, 0))).toBeNull();
    expect(updated.charAt(pos(1, 0))).toBe(B);
  });

  test("removes an element that becomes empty after erasing", () => {
    const fd = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]));
    const doc = makeDoc(fd);
    const result = useCase.execute({ document: doc, cells: [pos(0, 0)] });
    expect(result.getElement("fd1")).toBeUndefined();
    expect(history.pushCalls).toHaveLength(1);
  });

  test("erases from highest z-index element first", () => {
    const fd1 = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]), 0);
    const fd2 = fdElement("fd2", pos(0, 0), new Map([[freeDrawCellKey(0, 0), B]]), 1);
    const doc = makeDoc(fd1, fd2);
    const result = useCase.execute({ document: doc, cells: [pos(0, 0)] });
    // fd2 has higher z-index → it gets erased first
    expect(result.getElement("fd2")).toBeUndefined(); // empty element removed
    expect((result.getElement("fd1") as FreeDrawElement).charAt(pos(0, 0))).toBe(A);
  });

  test("erases multiple cells in one pass (one undo snapshot)", () => {
    const cells = new Map([
      [freeDrawCellKey(0, 0), A],
      [freeDrawCellKey(1, 0), B],
    ]);
    const fd = fdElement("fd1", pos(0, 0), cells);
    const doc = makeDoc(fd);
    const result = useCase.execute({ document: doc, cells: [pos(0, 0), pos(1, 0)] });
    expect(result.getElement("fd1")).toBeUndefined(); // both erased → removed
    expect(history.pushCalls).toHaveLength(1);
  });

  test("empty cells list → no push, returns same doc", () => {
    const fd = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]));
    const doc = makeDoc(fd);
    const result = useCase.execute({ document: doc, cells: [] });
    expect(result).toBe(doc);
    expect(history.pushCalls).toHaveLength(0);
  });
});

describe("eraseCellsOnDocument (pure helper)", () => {
  test("returns same doc by identity when nothing matches", () => {
    const fd = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]));
    const doc = makeDoc(fd);
    const result = eraseCellsOnDocument(doc, [pos(9, 9)]);
    expect(result).toBe(doc);
  });

  test("removes char from matching element", () => {
    const fd = fdElement("fd1", pos(0, 0), new Map([[freeDrawCellKey(0, 0), A]]));
    const doc = makeDoc(fd);
    const result = eraseCellsOnDocument(doc, [pos(0, 0)]);
    expect(result.getElement("fd1")).toBeUndefined();
  });
});
