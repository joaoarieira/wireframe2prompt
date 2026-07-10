import type { IGlyphMapper } from "../../domain/ports/IGlyphMapper";
import { UnknownGlyphMapperError } from "./UnknownGlyphMapperError";

/** Registry of glyph mappers keyed by element kind. */
export class GlyphMapperRegistry {
  private readonly mappers = new Map<string, IGlyphMapper>();

  register(mapper: IGlyphMapper): this {
    this.mappers.set(mapper.kind, mapper);
    return this;
  }

  has(kind: string): boolean {
    return this.mappers.has(kind);
  }

  get(kind: string): IGlyphMapper {
    const mapper = this.mappers.get(kind);
    if (mapper === undefined) {
      throw new UnknownGlyphMapperError(kind);
    }
    return mapper;
  }
}
