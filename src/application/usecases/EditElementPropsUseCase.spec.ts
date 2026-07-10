import { describe, expect, test } from "vitest";
import { EditElementPropsUseCase } from "./EditElementPropsUseCase";
import { SpyHistory } from "../../tests/doubles/SpyHistory";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";
import { TextElement } from "../../domain/entities/element/TextElement";
import { makeDoc, makeText } from "../../tests/fixtures";

describe("EditElementPropsUseCase", () => {
  test("edits type-specific props and pushes a snapshot", () => {
    const history = new SpyHistory();
    const doc = makeDoc(makeText("t", "OK"));
    const useCase = new EditElementPropsUseCase(history);

    const result = useCase.execute({
      document: doc,
      elementId: "t",
      props: { text: "Cancel" },
    });

    expect((result.getElement("t") as TextElement).text).toBe("Cancel");
    expect((doc.getElement("t") as TextElement).text).toBe("OK");
    expect(history.pushCalls).toEqual([doc]);
  });

  test("throws when the element does not exist and does not push", () => {
    const history = new SpyHistory();
    const doc = makeDoc();
    const useCase = new EditElementPropsUseCase(history);

    expect(() =>
      useCase.execute({
        document: doc,
        elementId: "nope",
        props: { text: "x" },
      }),
    ).toThrow(ElementNotFoundError);
    expect(history.pushCalls).toHaveLength(0);
  });
});
