import { describe, expect, test } from "vitest";
import { GlyphMapperRegistry } from "./GlyphMapperRegistry";
import { UnknownGlyphMapperError } from "./UnknownGlyphMapperError";
import { BoxGlyphMapper } from "./mappers/BoxGlyphMapper";

describe("GlyphMapperRegistry", () => {
  test("get returns the mapper registered for a kind", () => {
    const mapper = new BoxGlyphMapper();
    const registry = new GlyphMapperRegistry().register(mapper);
    expect(registry.get("box")).toBe(mapper);
    expect(registry.has("box")).toBe(true);
  });

  test("get throws for an unregistered kind", () => {
    const registry = new GlyphMapperRegistry();
    expect(registry.has("box")).toBe(false);
    expect(() => registry.get("box")).toThrow(UnknownGlyphMapperError);
  });

  test("register overrides a previously registered mapper for the same kind", () => {
    const first = new BoxGlyphMapper();
    const second = new BoxGlyphMapper();
    const registry = new GlyphMapperRegistry().register(first).register(second);
    expect(registry.get("box")).toBe(second);
  });
});
