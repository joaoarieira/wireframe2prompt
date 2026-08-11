import type { Element } from "../../entities/element/Element";
import type { GridSize } from "../../entities/grid-size/GridSize";
import type { Layer } from "../../entities/layer/Layer";
import type { Position } from "../../entities/position/Position";
import type { Size } from "../../entities/size/Size";
import { DuplicateElementError } from "../../entities/errors/DuplicateElementError";
import { ElementNotFoundError } from "../../entities/errors/ElementNotFoundError";

export interface WireframeDocumentProps {
  id: string;
  name: string;
  gridSize: GridSize;
  elements: readonly Element[];
  layers: readonly Layer[];
  /** Epoch milliseconds of the last edit; stamped by the caller on save. */
  lastEdit: number;
}

/**
 * Aggregate root. Immutable: every mutator returns a new document, leaving the
 * previous instance untouched (which is what makes snapshot-based undo/redo
 * trivial).
 */
export class WireframeDocument {
  public readonly id: string;
  public readonly name: string;
  public readonly gridSize: GridSize;
  public readonly elements: readonly Element[];
  public readonly layers: readonly Layer[];
  /** Epoch milliseconds of the last edit; 0 until first stamped on save. */
  public readonly lastEdit: number;

  private constructor(props: WireframeDocumentProps) {
    this.id = props.id;
    this.name = props.name;
    this.gridSize = props.gridSize;
    this.elements = props.elements;
    this.layers = props.layers;
    this.lastEdit = props.lastEdit;
  }

  static create(props: {
    id: string;
    name: string;
    gridSize: GridSize;
    elements?: readonly Element[];
    layers?: readonly Layer[];
    /** Epoch ms; defaults to 0 (unstamped) — SaveDocument stamps it on persist. */
    lastEdit?: number;
  }): WireframeDocument {
    return new WireframeDocument({
      id: props.id,
      name: props.name,
      gridSize: props.gridSize,
      elements: props.elements ?? [],
      layers: props.layers ?? [],
      lastEdit: props.lastEdit ?? 0,
    });
  }

  private withElements(elements: readonly Element[]): WireframeDocument {
    return new WireframeDocument({
      id: this.id,
      name: this.name,
      gridSize: this.gridSize,
      elements,
      layers: this.layers,
      lastEdit: this.lastEdit,
    });
  }

  /** Returns a copy under a new name; all else unchanged. */
  rename(name: string): WireframeDocument {
    return new WireframeDocument({
      id: this.id,
      name,
      gridSize: this.gridSize,
      elements: this.elements,
      layers: this.layers,
      lastEdit: this.lastEdit,
    });
  }

  /** Returns a copy stamped with a new last-edit time; all else unchanged. */
  withLastEdit(lastEdit: number): WireframeDocument {
    return new WireframeDocument({
      id: this.id,
      name: this.name,
      gridSize: this.gridSize,
      elements: this.elements,
      layers: this.layers,
      lastEdit,
    });
  }

  getElement(elementId: string): Element | undefined {
    return this.elements.find((element) => element.id === elementId);
  }

  private requireIndex(elementId: string): number {
    const index = this.elements.findIndex(
      (element) => element.id === elementId,
    );
    if (index === -1) {
      throw new ElementNotFoundError(elementId);
    }
    return index;
  }

  /** Elements ordered by ascending z-index; ties keep insertion order. */
  elementsByZIndex(): readonly Element[] {
    return [...this.elements].sort((a, b) => a.zIndex - b.zIndex);
  }

  addElement(element: Element): WireframeDocument {
    if (this.getElement(element.id) !== undefined) {
      throw new DuplicateElementError(element.id);
    }
    return this.withElements([...this.elements, element]);
  }

  removeElement(elementId: string): WireframeDocument {
    const index = this.requireIndex(elementId);
    const elements = this.elements.filter((_, i) => i !== index);
    return this.withElements(elements);
  }

  private replaceAt(index: number, element: Element): WireframeDocument {
    const elements = this.elements.map((current, i) =>
      i === index ? element : current,
    );
    return this.withElements(elements);
  }

  replaceElement(element: Element): WireframeDocument {
    const index = this.requireIndex(element.id);
    return this.replaceAt(index, element);
  }

  moveElement(elementId: string, position: Position): WireframeDocument {
    const index = this.requireIndex(elementId);
    return this.replaceAt(index, this.elements[index].moveTo(position));
  }

  resizeElement(elementId: string, size: Size): WireframeDocument {
    const index = this.requireIndex(elementId);
    return this.replaceAt(index, this.elements[index].resize(size));
  }

  reorderElement(elementId: string, zIndex: number): WireframeDocument {
    const index = this.requireIndex(elementId);
    return this.replaceAt(index, this.elements[index].withZIndex(zIndex));
  }

  /**
   * Changes the grid dimensions, keeping every element as-is. Elements that
   * fall outside a shrunk grid are preserved (never clamped here) so growing
   * the grid again brings them back — the compositor clips on rasterization.
   */
  resizeGrid(gridSize: GridSize): WireframeDocument {
    return new WireframeDocument({
      id: this.id,
      name: this.name,
      gridSize,
      elements: this.elements,
      layers: this.layers,
      lastEdit: this.lastEdit,
    });
  }
}
