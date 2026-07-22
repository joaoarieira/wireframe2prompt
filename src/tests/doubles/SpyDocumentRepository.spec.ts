import { describe, expect, test } from "vitest";
import { SpyDocumentRepository } from "./SpyDocumentRepository";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";

const doc = (id: string, name: string, lastEdit = 0) =>
  WireframeDocument.create({
    id,
    name,
    gridSize: GridSize.create(10, 10),
    lastEdit,
  });

describe("SpyDocumentRepository", () => {
  test("save then load returns the stored document and records the calls", async () => {
    const repo = new SpyDocumentRepository();
    const first = doc("doc1", "First");
    await repo.save(first);
    expect(repo.saveCalls).toEqual([first]);
    expect(await repo.load("doc1")).toBe(first);
    expect(repo.loadCalls).toEqual(["doc1"]);
  });

  test("load returns null for an unknown id", async () => {
    const repo = new SpyDocumentRepository();
    expect(await repo.load("missing")).toBeNull();
  });

  test("list summarizes every stored document, most-recently-edited first", async () => {
    const repo = new SpyDocumentRepository();
    await repo.save(doc("a", "Alpha", 100));
    await repo.save(doc("b", "Beta", 300));
    expect(await repo.list()).toEqual([
      { id: "b", name: "Beta", lastEdit: 300 },
      { id: "a", name: "Alpha", lastEdit: 100 },
    ]);
  });

  test("delete removes the document and records the id", async () => {
    const repo = new SpyDocumentRepository();
    await repo.save(doc("a", "Alpha"));
    await repo.delete("a");
    expect(repo.deleteCalls).toEqual(["a"]);
    expect(await repo.load("a")).toBeNull();
    expect(await repo.list()).toEqual([]);
  });
});
