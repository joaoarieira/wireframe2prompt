import { describe, expect, test } from "vitest";
import { Layer } from "./Layer";

describe("Layer", () => {
  test("must create a visible, unlocked layer by default", () => {
    const layer = Layer.create({ id: "l1", name: "Layer 1" });
    expect(layer.id).toBe("l1");
    expect(layer.name).toBe("Layer 1");
    expect(layer.visible).toBe(true);
    expect(layer.locked).toBe(false);
  });

  test("setVisible must return a new layer without mutating the original", () => {
    const layer = Layer.create({ id: "l1", name: "Layer 1" });
    const hidden = layer.setVisible(false);
    expect(hidden.visible).toBe(false);
    expect(layer.visible).toBe(true);
    expect(hidden).not.toBe(layer);
  });

  test("setLocked must return a new locked layer", () => {
    const layer = Layer.create({ id: "l1", name: "Layer 1" });
    expect(layer.setLocked(true).locked).toBe(true);
    expect(layer.locked).toBe(false);
  });

  test("rename must return a new renamed layer", () => {
    const layer = Layer.create({ id: "l1", name: "Layer 1" });
    expect(layer.rename("Background").name).toBe("Background");
    expect(layer.name).toBe("Layer 1");
  });
});
