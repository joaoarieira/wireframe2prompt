import { describe, expect, test } from "vitest";
import { isTitledElement } from "./TitledElement";
import { CardElement } from "./CardElement";
import { ModalElement } from "./ModalElement";
import { BoxElement } from "./BoxElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "e1",
  position: Position.create(0, 0),
  size: Size.create(10, 5),
  zIndex: 0,
  layerId: null,
};

describe("isTitledElement", () => {
  test("true for a card", () => {
    expect(isTitledElement(CardElement.create({ ...base, title: "T" }))).toBe(
      true,
    );
  });

  test("true for a modal", () => {
    expect(isTitledElement(ModalElement.create({ ...base, title: null }))).toBe(
      true,
    );
  });

  test("false for an element without a title", () => {
    expect(isTitledElement(BoxElement.create(base))).toBe(false);
  });
});
