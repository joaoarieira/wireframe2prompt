import { describe, expect, test } from "vitest";
import { Position } from "./Position";
import { InvalidPositionError } from "../errors/InvalidPositionError";

describe("Position", () => {
  test("must return a new instance when two integer numbers are used on create", () => {
    const col = 1;
    const row = 2;
    const position = Position.create(col, row);
    expect(position.col).equals(col);
    expect(position.row).equals(row);
  });

  test("must throw when col is a float number on create", () => {
    expect(() => Position.create(1.5, 0)).toThrow(InvalidPositionError);
  });

  test("must throw when row is a float number on create", () => {
    expect(() => Position.create(0, 1.5)).toThrow(InvalidPositionError);
  });

  test("must accept negative coordinates (positions outside the grid are valid)", () => {
    const col = -1;
    const row = -5;
    const position = Position.create(col, row);
    expect(position.col).equals(col);
    expect(position.row).equals(row);
  });
});
