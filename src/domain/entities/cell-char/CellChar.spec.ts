import { describe, expect, test } from "vitest";
import { CellChar } from "./CellChar";

const INVALID_LENGTH_ERROR_SUBSTRING = "length";

describe("CellChar", () => {
  test("must return a new instance when create arg is a string with length 1", () => {
    const value = "a";
    const cellChar = CellChar.create(value);
    expect(cellChar.value).equals(value);
  });

  test("must throw when create arg is a empty string", () => {
    expect(() => CellChar.create("")).toThrow(INVALID_LENGTH_ERROR_SUBSTRING);
  });

  test("must throw when create arg is a string with a single space", () => {
    expect(() => CellChar.create(" ")).toThrow(INVALID_LENGTH_ERROR_SUBSTRING);
  });
});
