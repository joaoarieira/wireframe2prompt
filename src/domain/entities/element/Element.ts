import type { Position } from "../position/Position";
import type { Size } from "../size/Size";

export interface ElementBaseProps {
  id: string;
  position: Position;
  size: Size;
  zIndex: number;
  layerId: string | null;
  /** User-given nickname shown in the layers panel; null = unnamed. */
  name?: string | null;
}

/**
 * Base of every wireframe element. Elements are immutable: every mutator
 * returns a new instance. Concrete subclasses add their type-specific data and
 * implement {@link cloneWith} so the shared mutators preserve that data.
 *
 * Elements do NOT render themselves — a central compositor walks them and a
 * per-kind glyph mapper turns each one into cells.
 */
export abstract class Element {
  abstract readonly kind: string;

  public readonly id: string;
  public readonly position: Position;
  public readonly size: Size;
  public readonly zIndex: number;
  public readonly layerId: string | null;
  public readonly name: string | null;

  protected constructor(props: ElementBaseProps) {
    this.id = props.id;
    this.position = props.position;
    this.size = props.size;
    this.zIndex = props.zIndex;
    this.layerId = props.layerId;
    this.name = props.name ?? null;
  }

  protected baseProps(): ElementBaseProps {
    return {
      id: this.id,
      position: this.position,
      size: this.size,
      zIndex: this.zIndex,
      layerId: this.layerId,
      name: this.name,
    };
  }

  /** Returns a new instance of the concrete element with base props overridden. */
  protected abstract cloneWith(overrides: Partial<ElementBaseProps>): Element;

  /**
   * Applies the kind-specific keys of a patch (e.g. `text`, `orientation`)
   * and ignores the rest. Base-level keys are handled by {@link withProps}.
   */
  protected abstract withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): Element;

  /**
   * Applies a partial patch: base props shared by every kind (currently
   * `name`) plus whatever kind-specific keys the concrete element accepts.
   *
   * @example
   * const renamed = element.withProps({ name: "Header", text: "Hello" });
   */
  withProps(patch: Readonly<Record<string, unknown>>): Element {
    const renamed =
      typeof patch.name === "string" || patch.name === null
        ? this.withName(patch.name)
        : this;
    return renamed.withKindProps(patch);
  }

  moveTo(position: Position): Element {
    return this.cloneWith({ position });
  }

  translate(deltaCol: number, deltaRow: number): Element {
    return this.cloneWith({
      position: this.position.translate(deltaCol, deltaRow),
    });
  }

  resize(size: Size): Element {
    return this.cloneWith({ size });
  }

  withZIndex(zIndex: number): Element {
    return this.cloneWith({ zIndex });
  }

  withLayer(layerId: string | null): Element {
    return this.cloneWith({ layerId });
  }

  withName(name: string | null): Element {
    return this.cloneWith({ name });
  }
}
