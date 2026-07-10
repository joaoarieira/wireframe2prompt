import { describe, expect, test } from "vitest";
import { Position } from "./Position";
import { InvalidPositionError } from "../errors/InvalidPositionError";

describe("Position", () => {
  test("must create a position with the given col and row", () => {
    const position = Position.create(2, 5);
    expect(position.col).toBe(2);
    expect(position.row).toBe(5);
  });

  test("must accept negative coordinates (elements may be dragged outside the grid)", () => {
    const position = Position.create(-3, -1);
    expect(position.col).toBe(-3);
    expect(position.row).toBe(-1);
  });

  test("must throw when col is not an integer", () => {
    expect(() => Position.create(1.5, 0)).toThrow(InvalidPositionError);
  });

  test("must throw when row is not an integer", () => {
    expect(() => Position.create(0, 1.5)).toThrow(InvalidPositionError);
  });

  test("translate must return a new translated position", () => {
    const position = Position.create(2, 3);
    const moved = position.translate(1, -1);
    expect(moved.col).toBe(3);
    expect(moved.row).toBe(2);
    expect(position.col).toBe(2);
    expect(position.row).toBe(3);
  });

  test("two positions with the same col and row must be equal", () => {
    expect(Position.create(1, 1).equals(Position.create(1, 1))).toBe(true);
    expect(Position.create(1, 1).equals(Position.create(1, 2))).toBe(false);
  });
});
