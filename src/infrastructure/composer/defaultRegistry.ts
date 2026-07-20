import { GlyphMapperRegistry } from "./GlyphMapperRegistry";
import { BoxGlyphMapper } from "./mappers/BoxGlyphMapper";
import { LineGlyphMapper } from "./mappers/LineGlyphMapper";
import { TextGlyphMapper } from "./mappers/TextGlyphMapper";
import { ArrowGlyphMapper } from "./mappers/ArrowGlyphMapper";
import { CardGlyphMapper } from "./mappers/CardGlyphMapper";
import { ModalGlyphMapper } from "./mappers/ModalGlyphMapper";
import { TableGlyphMapper } from "./mappers/TableGlyphMapper";
import { TabsGlyphMapper } from "./mappers/TabsGlyphMapper";
import { InputGlyphMapper } from "./mappers/InputGlyphMapper";
import { DropdownGlyphMapper } from "./mappers/DropdownGlyphMapper";
import { FreeDrawGlyphMapper } from "./mappers/FreeDrawGlyphMapper";

/** Registry wired with all implemented mappers. */
export function createDefaultGlyphMapperRegistry(): GlyphMapperRegistry {
  return new GlyphMapperRegistry()
    .register(new BoxGlyphMapper())
    .register(new LineGlyphMapper())
    .register(new TextGlyphMapper())
    .register(new ArrowGlyphMapper())
    .register(new CardGlyphMapper())
    .register(new ModalGlyphMapper())
    .register(new TableGlyphMapper())
    .register(new TabsGlyphMapper())
    .register(new InputGlyphMapper())
    .register(new DropdownGlyphMapper())
    .register(new FreeDrawGlyphMapper());
}
