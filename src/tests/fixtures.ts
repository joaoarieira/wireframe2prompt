import { WireframeDocument } from "../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../domain/entities/grid-size/GridSize";
import { Position } from "../domain/entities/position/Position";
import { Size } from "../domain/entities/size/Size";
import { BoxElement } from "../domain/entities/element/BoxElement";
import { TextElement } from "../domain/entities/element/TextElement";

export function makeBox(id: string, zIndex = 0): BoxElement {
  return BoxElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(2, 2),
    zIndex,
    layerId: null,
  });
}

export function makeText(id: string, text: string): TextElement {
  return TextElement.create({
    id,
    position: Position.create(0, 0),
    size: Size.create(Math.max(1, [...text].length), 1),
    zIndex: 0,
    layerId: null,
    text,
  });
}

export function makeDoc(
  ...elements: Array<BoxElement | TextElement>
): WireframeDocument {
  return WireframeDocument.create({
    id: "doc1",
    name: "Untitled",
    gridSize: GridSize.create(20, 10),
    elements,
  });
}
