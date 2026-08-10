import type { Element } from "./Element";
import type { Position } from "../position/Position";
import type { TitleRegion } from "./titleGeometry";
import { CardElement } from "./CardElement";
import { ModalElement } from "./ModalElement";

/**
 * An element that rasterizes a single-line title on its second row. Lets the
 * canvas open one inline title editor for every such kind instead of branching
 * per kind (see TitleEditOverlay).
 */
export interface TitledElement extends Element {
  readonly title: string | null;
  titleRegion(): TitleRegion;
  titleAtCell(cell: Position): boolean;
}

/**
 * Narrows an element to the titled kinds. Listing the classes (rather than
 * duck-typing the methods) keeps the set explicit and checked by the compiler.
 *
 * @example if (isTitledElement(hit)) beginCanvasInlineEditing(hit.id);
 */
export function isTitledElement(element: Element): element is TitledElement {
  return element instanceof CardElement || element instanceof ModalElement;
}
