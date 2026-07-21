import type { Position } from "../position/Position";
import type { Size } from "../size/Size";
import { BorderStyle } from "../../value-objects/border-style/BorderStyle";

export interface ElementBaseProps {
  id: string;
  position: Position;
  size: Size;
  zIndex: number;
  layerId: string | null;
  /** User-given nickname shown in the layers panel; null = unnamed. */
  name?: string | null;
  /**
   * Glyph set used to draw this element's border. Defaults to
   * {@link BorderStyle.square}. Ignored by borderless kinds (see
   * {@link Element.hasBorder}).
   */
  borderStyle?: BorderStyle;
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
  public readonly borderStyle: BorderStyle;

  protected constructor(props: ElementBaseProps) {
    this.id = props.id;
    this.position = props.position;
    this.size = props.size;
    this.zIndex = props.zIndex;
    this.layerId = props.layerId;
    this.name = props.name ?? null;
    this.borderStyle = props.borderStyle ?? BorderStyle.square();
  }

  /**
   * Whether this kind draws a box border (so a border style is meaningful).
   * False here; bordered kinds (box, card, modal, table, field) override it.
   */
  get hasBorder(): boolean {
    return false;
  }

  protected baseProps(): ElementBaseProps {
    return {
      id: this.id,
      position: this.position,
      size: this.size,
      zIndex: this.zIndex,
      layerId: this.layerId,
      name: this.name,
      borderStyle: this.borderStyle,
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
    const restyled =
      patch.borderStyle instanceof BorderStyle
        ? renamed.withBorderStyle(patch.borderStyle)
        : renamed;
    return restyled.withKindProps(patch);
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

  /** New instance with a different border style (a no-op visually on borderless kinds). */
  withBorderStyle(borderStyle: BorderStyle): Element {
    return this.cloneWith({ borderStyle });
  }

  /** New identity for a structurally identical element (used by copy/duplicate). */
  withId(id: string): Element {
    return this.cloneWith({ id });
  }
}
