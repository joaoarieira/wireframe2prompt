import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import type { InputElement } from "../../../domain/entities/element/InputElement";
import { mapFieldElement } from "./fieldGlyphs";

export class InputGlyphMapper implements IGlyphMapper {
  readonly kind = "input";

  map(element: Element): GlyphCell[] {
    return mapFieldElement(element as InputElement);
  }
}
