import { describe, expect, test } from "vitest";
import { InMemoryHistory } from "./InMemoryHistory";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";

const doc = (id: string) =>
  WireframeDocument.create({ id, name: id, gridSize: GridSize.create(10, 10) });

describe("InMemoryHistory", () => {
  test("starts empty: nothing to undo or redo", () => {
    const history = new InMemoryHistory();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  test("push enables undo and clears redo", () => {
    const history = new InMemoryHistory();
    history.push(doc("v1"));
    history.undo(doc("v2"));
    history.push(doc("v3")); // pushing after an undo drops the redo branch

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  test("undo returns the previous snapshot and enables redo", () => {
    const history = new InMemoryHistory();
    const v1 = doc("v1");
    history.push(v1);

    expect(history.undo(doc("v2"))).toBe(v1);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
  });

  test("undo returns null when there is nothing to undo", () => {
    const history = new InMemoryHistory();
    expect(history.undo(doc("v1"))).toBeNull();
  });

  test("redo replays the snapshot that was undone", () => {
    const history = new InMemoryHistory();
    const v1 = doc("v1");
    const v2 = doc("v2");
    history.push(v1);

    expect(history.undo(v2)).toBe(v1);
    expect(history.redo(v1)).toBe(v2);
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
  });

  test("redo returns null when there is nothing to redo", () => {
    const history = new InMemoryHistory();
    expect(history.redo(doc("v1"))).toBeNull();
  });

  test("undo/redo walk a multi-step stack in order", () => {
    const history = new InMemoryHistory();
    const v1 = doc("v1");
    const v2 = doc("v2");
    const v3 = doc("v3");
    history.push(v1);
    history.push(v2);

    expect(history.undo(v3)).toBe(v2);
    expect(history.undo(v2)).toBe(v1);
    expect(history.canUndo).toBe(false);
    expect(history.redo(v1)).toBe(v2);
    expect(history.redo(v2)).toBe(v3);
  });
});
