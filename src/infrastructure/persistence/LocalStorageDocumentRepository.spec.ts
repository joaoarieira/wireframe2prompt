import { describe, expect, test } from "vitest";
import { LocalStorageDocumentRepository } from "./LocalStorageDocumentRepository";
import { serializeDocument } from "./documentSerialization";
import type { SerializedDocument } from "./documentSerialization";
import { InMemoryWebStorage } from "../../tests/doubles/InMemoryWebStorage";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { makeBox } from "../../tests/fixtures";

const doc = (id: string, name: string, ...elementIds: string[]) =>
  WireframeDocument.create({
    id,
    name,
    gridSize: GridSize.create(20, 10),
    elements: elementIds.map((elementId) => makeBox(elementId)),
  });

const summary = (id: string, name: string, lastEdit = 0) => ({
  id,
  name,
  lastEdit,
});

describe("LocalStorageDocumentRepository", () => {
  test("save then load restores an equivalent document", async () => {
    const repo = new LocalStorageDocumentRepository(new InMemoryWebStorage());
    const original = doc("d1", "Screen", "box-a", "box-b");

    await repo.save(original);
    const loaded = await repo.load("d1");

    expect(loaded).not.toBeNull();
    expect(serializeDocument(loaded!)).toEqual(serializeDocument(original));
  });

  test("load returns null for an unknown id", async () => {
    const repo = new LocalStorageDocumentRepository(new InMemoryWebStorage());
    expect(await repo.load("missing")).toBeNull();
  });

  test("save persists JSON under the prefixed key", async () => {
    const storage = new InMemoryWebStorage();
    const repo = new LocalStorageDocumentRepository(storage, "app:doc:");

    await repo.save(doc("d1", "Screen"));

    const raw = storage.getItem("app:doc:d1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).id).toBe("d1");
  });

  test("list summarizes every stored document", async () => {
    const repo = new LocalStorageDocumentRepository(new InMemoryWebStorage());
    await repo.save(doc("a", "Alpha"));
    await repo.save(doc("b", "Beta"));

    expect(await repo.list()).toEqual([
      summary("a", "Alpha"),
      summary("b", "Beta"),
    ]);
  });

  test("list orders summaries most-recently-edited first", async () => {
    const repo = new LocalStorageDocumentRepository(new InMemoryWebStorage());
    await repo.save(doc("old", "Old").withLastEdit(100));
    await repo.save(doc("new", "New").withLastEdit(900));
    await repo.save(doc("mid", "Mid").withLastEdit(500));

    expect(await repo.list()).toEqual([
      summary("new", "New", 900),
      summary("mid", "Mid", 500),
      summary("old", "Old", 100),
    ]);
  });

  test("list defaults lastEdit to 0 for a payload written before the field existed", async () => {
    const storage = new InMemoryWebStorage();
    const repo = new LocalStorageDocumentRepository(storage);
    const legacy: Omit<SerializedDocument, "lastEdit"> = {
      version: 1,
      id: "legacy",
      name: "Legacy",
      gridSize: { cols: 20, rows: 10 },
      elements: [],
      layers: [],
    };
    storage.setItem("wireframe2prompt:doc:legacy", JSON.stringify(legacy));

    expect(await repo.list()).toEqual([summary("legacy", "Legacy", 0)]);
  });

  test("list ignores keys that do not belong to this repository", async () => {
    const storage = new InMemoryWebStorage();
    storage.setItem("unrelated", "not a document");
    const repo = new LocalStorageDocumentRepository(storage);

    await repo.save(doc("a", "Alpha"));

    expect(await repo.list()).toEqual([summary("a", "Alpha")]);
  });

  test("delete removes the document and leaves others intact", async () => {
    const repo = new LocalStorageDocumentRepository(new InMemoryWebStorage());
    await repo.save(doc("a", "Alpha"));
    await repo.save(doc("b", "Beta"));

    await repo.delete("a");

    expect(await repo.load("a")).toBeNull();
    expect(await repo.list()).toEqual([summary("b", "Beta")]);
  });

  test("two repositories on different prefixes stay isolated", async () => {
    const storage = new InMemoryWebStorage();
    const drafts = new LocalStorageDocumentRepository(storage, "drafts:");
    const published = new LocalStorageDocumentRepository(storage, "published:");

    await drafts.save(doc("x", "Draft"));

    expect(await published.list()).toEqual([]);
    expect(await published.load("x")).toBeNull();
    expect(await drafts.list()).toEqual([summary("x", "Draft")]);
  });
});
