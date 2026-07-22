import { describe, expect, test } from "vitest";
import { SaveDocumentUseCase } from "./SaveDocumentUseCase";
import { SpyDocumentRepository } from "../../tests/doubles/SpyDocumentRepository";
import { FixedClock } from "../../tests/doubles/FixedClock";
import { makeDoc } from "../../tests/fixtures";

describe("SaveDocumentUseCase", () => {
  test("stamps the document with the clock time and persists it", async () => {
    const repository = new SpyDocumentRepository();
    const clock = new FixedClock(1_700_000_000_000);
    const doc = makeDoc();
    const useCase = new SaveDocumentUseCase(repository, clock);

    await useCase.execute({ document: doc });

    expect(repository.saveCalls).toHaveLength(1);
    expect(repository.saveCalls[0].id).toBe(doc.id);
    expect(repository.saveCalls[0].lastEdit).toBe(1_700_000_000_000);
  });
});
