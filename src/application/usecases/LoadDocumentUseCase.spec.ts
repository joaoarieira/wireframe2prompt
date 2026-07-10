import { describe, expect, test } from "vitest";
import { LoadDocumentUseCase } from "./LoadDocumentUseCase";
import { SpyDocumentRepository } from "../../tests/doubles/SpyDocumentRepository";
import { makeDoc } from "../../tests/fixtures";

describe("LoadDocumentUseCase", () => {
  test("returns the stored document by id", async () => {
    const repository = new SpyDocumentRepository();
    const doc = makeDoc();
    await repository.save(doc);
    const useCase = new LoadDocumentUseCase(repository);

    const result = await useCase.execute({ id: doc.id });

    expect(result).toBe(doc);
    expect(repository.loadCalls).toEqual([doc.id]);
  });

  test("returns null when the document does not exist", async () => {
    const repository = new SpyDocumentRepository();
    const useCase = new LoadDocumentUseCase(repository);

    expect(await useCase.execute({ id: "missing" })).toBeNull();
  });
});
