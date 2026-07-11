import { describe, expect, test } from "vitest";
import { WireframeDocument } from "./WireframeDocument";
import { GridSize } from "../../entities/grid-size/GridSize";
import { Position } from "../../entities/position/Position";
import { Size } from "../../entities/size/Size";
import { BoxElement } from "../../entities/element/BoxElement";
import { ElementNotFoundError } from "../../entities/errors/ElementNotFoundError";
import { DuplicateElementError } from "../../entities/errors/DuplicateElementError";

const box = (id: string, zIndex = 0) =>
  BoxElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(2, 2),
    zIndex,
    layerId: null,
  });

const emptyDoc = () =>
  WireframeDocument.create({
    id: "doc1",
    name: "Untitled",
    gridSize: GridSize.create(10, 10),
  });

describe("WireframeDocument", () => {
  test("create must start with no elements", () => {
    expect(emptyDoc().elements).toHaveLength(0);
  });

  test("addElement must return a new document without mutating the original", () => {
    const doc = emptyDoc();
    const next = doc.addElement(box("a"));
    expect(next).not.toBe(doc);
    expect(doc.elements).toHaveLength(0);
    expect(next.elements).toHaveLength(1);
    expect(next.getElement("a")).toBeDefined();
  });

  test("addElement must throw on a duplicate id", () => {
    const doc = emptyDoc().addElement(box("a"));
    expect(() => doc.addElement(box("a"))).toThrow(DuplicateElementError);
  });

  test("removeElement must drop the element and keep the original intact", () => {
    const doc = emptyDoc().addElement(box("a")).addElement(box("b"));
    const next = doc.removeElement("a");
    expect(next.getElement("a")).toBeUndefined();
    expect(next.getElement("b")).toBeDefined();
    expect(doc.getElement("a")).toBeDefined();
  });

  test("moveElement must update only the targeted element", () => {
    const doc = emptyDoc().addElement(box("a"));
    const next = doc.moveElement("a", Position.create(4, 5));
    expect(next.getElement("a")!.position.equals(Position.create(4, 5))).toBe(
      true,
    );
    expect(doc.getElement("a")!.position.equals(Position.create(0, 0))).toBe(
      true,
    );
  });

  test("resizeElement must update the element size", () => {
    const doc = emptyDoc().addElement(box("a"));
    const next = doc.resizeElement("a", Size.create(6, 4));
    expect(next.getElement("a")!.size.equals(Size.create(6, 4))).toBe(true);
  });

  test("reorderElement must update the element z-index", () => {
    const doc = emptyDoc().addElement(box("a"));
    const next = doc.reorderElement("a", 9);
    expect(next.getElement("a")!.zIndex).toBe(9);
  });

  test("mutators must throw when the element does not exist", () => {
    const doc = emptyDoc();
    expect(() => doc.removeElement("nope")).toThrow(ElementNotFoundError);
    expect(() => doc.moveElement("nope", Position.create(0, 0))).toThrow(
      ElementNotFoundError,
    );
    expect(() => doc.resizeElement("nope", Size.create(1, 1))).toThrow(
      ElementNotFoundError,
    );
    expect(() => doc.reorderElement("nope", 1)).toThrow(ElementNotFoundError);
  });

  test("replace mutators must leave the untargeted elements untouched (same ref)", () => {
    const doc = emptyDoc().addElement(box("a")).addElement(box("b"));
    const next = doc.moveElement("b", Position.create(3, 3));
    expect(next.getElement("b")!.position.equals(Position.create(3, 3))).toBe(
      true,
    );
    expect(next.getElement("a")).toBe(doc.getElement("a"));
  });

  test("elementsByZIndex must sort ascending and keep insertion order for ties", () => {
    const doc = emptyDoc()
      .addElement(box("a", 2))
      .addElement(box("b", 0))
      .addElement(box("c", 0));
    const ordered = doc.elementsByZIndex().map((e) => e.id);
    expect(ordered).toEqual(["b", "c", "a"]);
  });
});
