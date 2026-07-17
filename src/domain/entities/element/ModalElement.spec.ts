import { describe, expect, test } from "vitest";
import { ModalElement } from "./ModalElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "m1",
  position: Position.create(0, 0),
  size: Size.create(14, 7),
  zIndex: 0,
  layerId: null,
};

describe("ModalElement", () => {
  test("creates with string title", () => {
    const modal = ModalElement.create({ ...base, title: "Modal" });
    expect(modal.kind).toBe("modal");
    expect(modal.title).toBe("Modal");
  });

  test("creates with null title", () => {
    const modal = ModalElement.create({ ...base, title: null });
    expect(modal.title).toBeNull();
  });

  test("withTitle returns new instance", () => {
    const modal = ModalElement.create({ ...base, title: "Old" });
    const updated = modal.withTitle("New");
    expect(updated.title).toBe("New");
    expect(modal.title).toBe("Old");
  });

  test("withTitle accepts null", () => {
    expect(ModalElement.create({ ...base, title: "X" }).withTitle(null).title).toBeNull();
  });

  test("withKindProps accepts string and null", () => {
    const modal = ModalElement.create({ ...base, title: null });
    expect((modal.withProps({ title: "Hi" }) as ModalElement).title).toBe("Hi");
    expect((modal.withProps({ title: null }) as ModalElement).title).toBeNull();
  });

  test("withKindProps ignores non-string/null", () => {
    const modal = ModalElement.create({ ...base, title: "Hi" });
    expect((modal.withProps({ title: 42 }) as ModalElement).title).toBe("Hi");
  });

  test("cloneWith preserves title", () => {
    const modal = ModalElement.create({ ...base, title: "M" });
    expect((modal.moveTo(Position.create(1, 2)) as ModalElement).title).toBe("M");
  });
});
