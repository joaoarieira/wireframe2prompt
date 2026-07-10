import { GlyphMapperRegistry } from "./GlyphMapperRegistry";
import { BoxGlyphMapper } from "./mappers/BoxGlyphMapper";
import { LineGlyphMapper } from "./mappers/LineGlyphMapper";
import { TextGlyphMapper } from "./mappers/TextGlyphMapper";

/** Registry wired with the mappers available so far (Box, Line, Text). */
export function createDefaultGlyphMapperRegistry(): GlyphMapperRegistry {
  return new GlyphMapperRegistry()
    .register(new BoxGlyphMapper())
    .register(new LineGlyphMapper())
    .register(new TextGlyphMapper());
}
