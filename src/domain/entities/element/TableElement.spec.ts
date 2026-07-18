import { describe, expect, test } from "vitest";
import { TableElement } from "./TableElement";
import { InvalidTableShapeError } from "../errors/InvalidTableShapeError";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "t1",
  position: Position.create(0, 0),
  size: Size.create(13, 7),
  zIndex: 0,
  layerId: null,
};

describe("TableElement", () => {
  test("creates with valid columns and rows", () => {
    const table = TableElement.create({ ...base, columns: 3, rows: 2 });
    expect(table.kind).toBe("table");
    expect(table.columns).toBe(3);
    expect(table.rows).toBe(2);
  });

  test("throws InvalidTableShapeError for zero columns", () => {
    expect(() => TableElement.create({ ...base, columns: 0, rows: 2 })).toThrow(
      InvalidTableShapeError,
    );
  });

  test("throws InvalidTableShapeError for zero rows", () => {
    expect(() => TableElement.create({ ...base, columns: 2, rows: 0 })).toThrow(
      InvalidTableShapeError,
    );
  });

  test("throws InvalidTableShapeError for non-integer columns", () => {
    expect(() =>
      TableElement.create({ ...base, columns: 1.5, rows: 2 }),
    ).toThrow(InvalidTableShapeError);
  });

  test("throws InvalidTableShapeError for negative rows", () => {
    expect(() =>
      TableElement.create({ ...base, columns: 2, rows: -1 }),
    ).toThrow(InvalidTableShapeError);
  });

  test("withColumns validates and returns new instance", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    const updated = table.withColumns(4);
    expect(updated.columns).toBe(4);
    expect(table.columns).toBe(2);
  });

  test("withColumns throws on invalid value", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    expect(() => table.withColumns(0)).toThrow(InvalidTableShapeError);
  });

  test("withRows validates and returns new instance", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    const updated = table.withRows(5);
    expect(updated.rows).toBe(5);
    expect(table.rows).toBe(2);
  });

  test("withRows throws on invalid value", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    expect(() => table.withRows(0)).toThrow(InvalidTableShapeError);
  });

  test("withKindProps patches columns and rows", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    const updated = table.withProps({ columns: 3, rows: 4 }) as TableElement;
    expect(updated.columns).toBe(3);
    expect(updated.rows).toBe(4);
  });

  test("withKindProps ignores invalid patches silently", () => {
    const table = TableElement.create({ ...base, columns: 2, rows: 2 });
    const updated = table.withProps({
      columns: 0,
      rows: "two",
    }) as TableElement;
    expect(updated.columns).toBe(2);
    expect(updated.rows).toBe(2);
  });

  test("cloneWith preserves columns and rows", () => {
    const table = TableElement.create({ ...base, columns: 3, rows: 2 });
    const moved = table.moveTo(Position.create(5, 5)) as TableElement;
    expect(moved.columns).toBe(3);
    expect(moved.rows).toBe(2);
  });
});
