import { describe, expect, test } from "vitest";
import { ComposeAsciiUseCase } from "./ComposeAsciiUseCase";
import { SpyComposer } from "../../tests/doubles/SpyComposer";
import { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { makeDoc } from "../../tests/fixtures";

describe("ComposeAsciiUseCase", () => {
  test("delegates to the composer and returns its buffer", () => {
    const buffer = CharBuffer.create(GridSize.create(2, 1));
    const composer = new SpyComposer(buffer);
    const doc = makeDoc();
    const useCase = new ComposeAsciiUseCase(composer);

    const result = useCase.execute({ document: doc });

    expect(result).toBe(buffer);
    expect(composer.composeCalls).toEqual([doc]);
  });
});
