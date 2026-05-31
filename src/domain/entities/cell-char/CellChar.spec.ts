import { describe, expect, test } from "vitest";
import { CellChar } from "./CellChar";
import { InvalidCellCharError } from '../errors/InvalidCellCharError';

describe("CellChar", () => {
  test("must return a new instance when create arg is a string with length 1", () => {
    const value = "a";
    const cellChar = CellChar.create(value);
    expect(cellChar.value).equals(value);
  });

  test("must return a new instance when create arg is a string with a single space", () => {
    const value = " ";
    const cellChar = CellChar.create(value);
    expect(cellChar.value).equals(value);
  });

  test("must throw when create arg is a empty string", () => {
    expect(() => CellChar.create("")).toThrow(InvalidCellCharError);
  });

  test("must throw when create arg is a string with more than 1 char", () => {
    expect(() => CellChar.create("ab")).toThrow(InvalidCellCharError);
  })
});
