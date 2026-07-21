import { afterEach, describe, expect, test, vi } from "vitest";
import { createContainer } from "./container";
import { InMemoryWebStorage } from "../tests/doubles/InMemoryWebStorage";
import { makeBox, makeDoc } from "../tests/fixtures";

const newApp = () => createContainer({ storage: new InMemoryWebStorage() });

describe("createContainer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("shares one history across mutation and undo/redo use cases", () => {
    const app = newApp();
    const empty = makeDoc();

    const withBox = app.addElement.execute({
      document: empty,
      element: makeBox("b1"),
    });

    expect(withBox.elements).toHaveLength(1);
    expect(app.history.canUndo).toBe(true);
    expect(app.undo.execute({ document: withBox })).toBe(empty);
    expect(app.redo.execute({ document: empty })).toBe(withBox);
  });

  test("composes and exports through the wired ZIndexComposer", () => {
    const app = newApp();
    const withBox = app.addElement.execute({
      document: makeDoc(),
      element: makeBox("b1"),
    });

    const ascii = app.exportAscii.execute({ document: withBox });
    const rows = ascii.split("\n");

    expect(rows).toHaveLength(10); // makeDoc grid is 20×10
    expect(rows[0].startsWith("┌┐")).toBe(true);
    expect(rows[1].startsWith("└┘")).toBe(true);
  });

  test("save then load round-trips through the wired repository", async () => {
    const app = newApp();
    const withBox = app.addElement.execute({
      document: makeDoc(),
      element: makeBox("b1"),
    });

    await app.saveDocument.execute({ document: withBox });
    const loaded = await app.loadDocument.execute({ id: withBox.id });

    expect(loaded).not.toBeNull();
    expect(app.exportAscii.execute({ document: loaded! })).toBe(
      app.exportAscii.execute({ document: withBox }),
    );
  });

  test("defaults to the browser localStorage when no storage is injected", async () => {
    const app = createContainer();
    const doc = makeDoc();

    await app.saveDocument.execute({ document: doc });
    const loaded = await app.loadDocument.execute({ id: doc.id });

    expect(loaded?.id).toBe(doc.id);
    await app.repository.delete(doc.id); // keep jsdom localStorage clean for other tests
  });

  test("throws when no storage is injected and localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(() => createContainer()).toThrow(/localStorage is unavailable/);
  });
});
