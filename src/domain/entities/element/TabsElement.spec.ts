import { describe, expect, test } from "vitest";
import { TabsElement } from "./TabsElement";
import { InvalidTabsError } from "../errors/InvalidTabsError";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "tab1",
  position: Position.create(0, 0),
  size: Size.create(15, 2),
  zIndex: 0,
  layerId: null,
};

describe("TabsElement", () => {
  test("creates with valid tabs and active", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B"], active: 0 });
    expect(el.kind).toBe("tabs");
    expect(el.tabs).toEqual(["A", "B"]);
    expect(el.active).toBe(0);
  });

  test("throws InvalidTabsError for empty tabs array", () => {
    expect(() => TabsElement.create({ ...base, tabs: [], active: 0 })).toThrow(
      InvalidTabsError,
    );
  });

  test("throws InvalidTabsError for active out of range", () => {
    expect(() => TabsElement.create({ ...base, tabs: ["A"], active: 1 })).toThrow(
      InvalidTabsError,
    );
    expect(() => TabsElement.create({ ...base, tabs: ["A"], active: -1 })).toThrow(
      InvalidTabsError,
    );
  });

  test("throws InvalidTabsError for non-integer active", () => {
    expect(() => TabsElement.create({ ...base, tabs: ["A"], active: 0.5 })).toThrow(
      InvalidTabsError,
    );
  });

  test("withTabs clamps active to new range", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B", "C"], active: 2 });
    const updated = el.withTabs(["X", "Y"]);
    expect(updated.tabs).toEqual(["X", "Y"]);
    expect(updated.active).toBe(1); // clamped from 2 to 1
  });

  test("withTabs throws for empty tabs", () => {
    const el = TabsElement.create({ ...base, tabs: ["A"], active: 0 });
    expect(() => el.withTabs([])).toThrow(InvalidTabsError);
  });

  test("withActive validates and returns new instance", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B"], active: 0 });
    const updated = el.withActive(1);
    expect(updated.active).toBe(1);
    expect(el.active).toBe(0);
  });

  test("withActive throws for invalid index", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B"], active: 0 });
    expect(() => el.withActive(2)).toThrow(InvalidTabsError);
    expect(() => el.withActive(-1)).toThrow(InvalidTabsError);
  });

  test("withKindProps patches tabs (clamps active)", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B", "C"], active: 2 });
    const updated = el.withProps({ tabs: ["X"] }) as TabsElement;
    expect(updated.tabs).toEqual(["X"]);
    expect(updated.active).toBe(0);
  });

  test("withKindProps patches active", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B"], active: 0 });
    const updated = el.withProps({ active: 1 }) as TabsElement;
    expect(updated.active).toBe(1);
  });

  test("withKindProps ignores invalid active silently", () => {
    const el = TabsElement.create({ ...base, tabs: ["A"], active: 0 });
    const updated = el.withProps({ active: 99 }) as TabsElement;
    expect(updated.active).toBe(0);
  });

  test("withKindProps ignores empty tabs array", () => {
    const el = TabsElement.create({ ...base, tabs: ["A"], active: 0 });
    const updated = el.withProps({ tabs: [] }) as TabsElement;
    expect(updated.tabs).toEqual(["A"]);
  });

  test("cloneWith preserves tabs and active", () => {
    const el = TabsElement.create({ ...base, tabs: ["A", "B"], active: 1 });
    const moved = el.moveTo(Position.create(3, 3)) as TabsElement;
    expect(moved.tabs).toEqual(["A", "B"]);
    expect(moved.active).toBe(1);
  });
});
