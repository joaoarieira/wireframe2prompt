import { describe, expect, test } from "vitest";
import { CardElement } from "./CardElement";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

const base = {
  id: "c1",
  position: Position.create(0, 0),
  size: Size.create(12, 6),
  zIndex: 0,
  layerId: null,
};

describe("CardElement", () => {
  test("creates with string title", () => {
    const card = CardElement.create({ ...base, title: "Hello" });
    expect(card.kind).toBe("card");
    expect(card.title).toBe("Hello");
  });

  test("creates with null title", () => {
    const card = CardElement.create({ ...base, title: null });
    expect(card.title).toBeNull();
  });

  test("withTitle returns new instance", () => {
    const card = CardElement.create({ ...base, title: "Old" });
    const updated = card.withTitle("New");
    expect(updated.title).toBe("New");
    expect(card.title).toBe("Old");
  });

  test("withTitle accepts null", () => {
    const card = CardElement.create({ ...base, title: "Title" });
    expect(card.withTitle(null).title).toBeNull();
  });

  test("withKindProps accepts string title", () => {
    const card = CardElement.create({ ...base, title: null });
    const updated = card.withProps({ title: "Hi" }) as CardElement;
    expect(updated.title).toBe("Hi");
  });

  test("withKindProps accepts null title", () => {
    const card = CardElement.create({ ...base, title: "Hi" });
    const updated = card.withProps({ title: null }) as CardElement;
    expect(updated.title).toBeNull();
  });

  test("withKindProps ignores non-string/null title", () => {
    const card = CardElement.create({ ...base, title: "Hi" });
    const updated = card.withProps({ title: 123 }) as CardElement;
    expect(updated.title).toBe("Hi");
  });

  test("cloneWith preserves title", () => {
    const card = CardElement.create({ ...base, title: "Card" });
    const moved = card.moveTo(Position.create(5, 5)) as CardElement;
    expect(moved.title).toBe("Card");
  });

  // The region has to match what CardGlyphMapper rasterizes, or the inline
  // editor sits off the glyphs it replaces.
  test("titleRegion matches the glyphs the mapper draws", () => {
    const card = CardElement.create({
      ...base,
      position: Position.create(3, 4),
      title: "Card",
    });
    const region = card.titleRegion();
    expect(region.position.equals(Position.create(5, 5))).toBe(true);
    expect(region.size.equals(Size.create(8, 1))).toBe(true);
  });

  test("titleRegion is as narrow as the mapper's truncation", () => {
    // A 6-wide card renders only max(0, 6 - 4) = 2 title characters.
    const card = CardElement.create({
      ...base,
      size: Size.create(6, 5),
      title: "Longtitle",
    });
    expect(card.titleRegion().size.equals(Size.create(2, 1))).toBe(true);
  });

  test("titleAtCell only accepts the title row", () => {
    const card = CardElement.create({ ...base, title: "Card" });
    expect(card.titleAtCell(Position.create(4, 1))).toBe(true);
    expect(card.titleAtCell(Position.create(4, 3))).toBe(false);
  });
});
