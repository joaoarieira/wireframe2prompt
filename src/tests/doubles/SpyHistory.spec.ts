import { describe, expect, test } from "vitest";
import { SpyHistory } from "./SpyHistory";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";

const doc = (id: string) =>
  WireframeDocument.create({ id, name: id, gridSize: GridSize.create(10, 10) });

describe("SpyHistory", () => {
  test("starts empty: nothing to undo or redo", () => {
    const history = new SpyHistory();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  test("push records the snapshot, enables undo and clears redo", () => {
    const history = new SpyHistory();
    const v1 = doc("v1");
    history.push(v1);
    expect(history.pushCalls).toEqual([v1]);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  test("undo returns the previous snapshot and enables redo", () => {
    const history = new SpyHistory();
    const v1 = doc("v1");
    history.push(v1);
    expect(history.undo(doc("v2"))).toBe(v1);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
  });

  test("undo returns null when there is nothing to undo", () => {
    const history = new SpyHistory();
    expect(history.undo(doc("v1"))).toBeNull();
  });

  test("redo replays the snapshot that was undone", () => {
    const history = new SpyHistory();
    const v1 = doc("v1");
    const v2 = doc("v2");
    history.push(v1);
    expect(history.undo(v2)).toBe(v1);
    expect(history.redo(v1)).toBe(v2);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  test("redo returns null when there is nothing to redo", () => {
    const history = new SpyHistory();
    expect(history.redo(doc("v1"))).toBeNull();
  });
});
