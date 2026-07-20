import type { Element } from "../../../domain/entities/element/Element";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { TabsElement } from "../../../domain/entities/element/TabsElement";
import { InputElement } from "../../../domain/entities/element/InputElement";
import { DropdownElement } from "../../../domain/entities/element/DropdownElement";
import type { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

/** Element kinds the palette can drop on the grid (mappers already exist). */
export type PlaceableKind =
  | "box"
  | "line"
  | "text"
  | "arrow"
  | "card"
  | "modal"
  | "table"
  | "tabs"
  | "input"
  | "dropdown";

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
  arrow: ({ id, position, zIndex }) =>
    ArrowElement.create({
      id,
      position,
      size: Size.create(6, 1),
      zIndex,
      layerId: null,
      direction: "right",
    }),
  card: ({ id, position, zIndex }) =>
    CardElement.create({
      id,
      position,
      size: Size.create(12, 6),
      zIndex,
      layerId: null,
      title: "Card",
    }),
  modal: ({ id, position, zIndex }) =>
    ModalElement.create({
      id,
      position,
      size: Size.create(14, 7),
      zIndex,
      layerId: null,
      title: "Modal",
    }),
  table: ({ id, position, zIndex }) =>
    TableElement.create({
      id,
      position,
      size: Size.create(13, 7),
      zIndex,
      layerId: null,
      columns: 3,
      rows: 2,
    }),
  tabs: ({ id, position, zIndex }) =>
    TabsElement.create({
      id,
      position,
      size: Size.create(15, 2),
      zIndex,
      layerId: null,
      tabs: ["Tab 1", "Tab 2"],
      active: 0,
    }),
  input: ({ id, position, zIndex }) =>
    InputElement.create({
      id,
      position,
      size: Size.create(22, 4),
      zIndex,
      layerId: null,
      label: "Label",
      placeholder: "Placeholder",
      hint: "Hint",
    }),
  dropdown: ({ id, position, zIndex }) =>
    DropdownElement.create({
      id,
      position,
      size: Size.create(22, 4),
      zIndex,
      layerId: null,
      label: "Label",
      placeholder: "Placeholder",
      hint: "Hint",
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
