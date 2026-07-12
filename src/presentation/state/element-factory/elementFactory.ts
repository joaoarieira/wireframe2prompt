import type { Element } from "../../../domain/entities/element/Element";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
import type { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

/** Element kinds the palette can drop on the grid (mappers already exist). */
export type PlaceableKind = "box" | "line" | "text";

export interface BuildElementSpec {
  id: string;
  position: Position;
  zIndex: number;
}

type ElementBuilder = (spec: BuildElementSpec) => Element;

/**
 * Default shapes for freshly placed elements. A record instead of a switch so
 * adding a new placeable kind is a single entry here (mirrors the
 * GlyphMapperRegistry open/closed approach).
 */
const buildersByKind: Record<PlaceableKind, ElementBuilder> = {
  box: ({ id, position, zIndex }) =>
    BoxElement.create({
      id,
      position,
      size: Size.create(8, 4),
      zIndex,
      layerId: null,
    }),
  line: ({ id, position, zIndex }) =>
    LineElement.create({
      id,
      position,
      size: Size.create(6, 1),
      zIndex,
      layerId: null,
      orientation: "h",
    }),
  text: ({ id, position, zIndex }) =>
    TextElement.create({
      id,
      position,
      size: Size.create(4, 1),
      zIndex,
      layerId: null,
      text: "Text",
    }),
};

/**
 * Builds a new element of the given kind with its default size/props.
 *
 * @example
 * const element = buildElement("box", { id, position: cell, zIndex: 3 });
 */
export function buildElement(
  kind: PlaceableKind,
  spec: BuildElementSpec,
): Element {
  return buildersByKind[kind](spec);
}
