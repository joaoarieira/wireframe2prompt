import { describe, expect, test } from "vitest";
import { ExportAsciiUseCase } from "./ExportAsciiUseCase";
import { SpyComposer } from "../../tests/doubles/SpyComposer";
import { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { makeDoc } from "../../tests/fixtures";

describe("ExportAsciiUseCase", () => {
  test("returns the raw string produced by the composed buffer", () => {
    const buffer = CharBuffer.create(GridSize.create(2, 1));
    buffer.set(Position.create(0, 0), CellChar.create("H"));
    buffer.set(Position.create(1, 0), CellChar.create("i"));
    const composer = new SpyComposer(buffer);
    const doc = makeDoc();
    const useCase = new ExportAsciiUseCase(composer);

    const result = useCase.execute({ document: doc });

    expect(result).toBe("Hi");
    expect(composer.composeCalls).toEqual([doc]);
  });
});
