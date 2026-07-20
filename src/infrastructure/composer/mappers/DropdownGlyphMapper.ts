import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import type { DropdownElement } from "../../../domain/entities/element/DropdownElement";
import { mapFieldElement } from "./fieldGlyphs";

export class DropdownGlyphMapper implements IGlyphMapper {
  readonly kind = "dropdown";

  map(element: Element): GlyphCell[] {
    return mapFieldElement(element as DropdownElement);
  }
}
