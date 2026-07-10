import { describe, expect, test } from "vitest";
import { SaveDocumentUseCase } from "./SaveDocumentUseCase";
import { SpyDocumentRepository } from "../../tests/doubles/SpyDocumentRepository";
import { makeDoc } from "../../tests/fixtures";

describe("SaveDocumentUseCase", () => {
  test("persists the document through the repository", async () => {
    const repository = new SpyDocumentRepository();
    const doc = makeDoc();
    const useCase = new SaveDocumentUseCase(repository);

    await useCase.execute({ document: doc });

    expect(repository.saveCalls).toEqual([doc]);
  });
});
