import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import type { Position } from "../position/Position";
import type { TitledElement } from "./TitledElement";
import type { TitleRegion } from "./titleGeometry";
import { isTitleCell, titleRegion } from "./titleGeometry";

export interface ModalElementProps extends ElementBaseProps {
  title: string | null;
}

/**
 * Two more columns than a card: ModalGlyphMapper puts the close button at
 * x+width-3, so the title has to stop before it.
 */
const TITLE_RESERVED_COLS = 6;

export class ModalElement extends Element implements TitledElement {
  readonly kind = "modal";
  public readonly title: string | null;

  get hasBorder(): boolean {
    return true;
  }

  private constructor(base: ElementBaseProps, title: string | null) {
    super(base);
    this.title = title;
  }

  static create(props: ModalElementProps): ModalElement {
    const { title, ...base } = props;
    return new ModalElement(base, title);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): ModalElement {
    return new ModalElement({ ...this.baseProps(), ...overrides }, this.title);
  }

  withTitle(title: string | null): ModalElement {
    return new ModalElement(this.baseProps(), title);
  }

  /** Editable region of the title (second row), stopping before the close button. */
  titleRegion(): TitleRegion {
    return titleRegion(this.position, this.size, TITLE_RESERVED_COLS);
  }

  /** Whether a cell sits on the title row, for canvas double-click editing. */
  titleAtCell(cell: Position): boolean {
    return isTitleCell(this.position, this.size, cell);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): ModalElement {
    if (typeof patch.title === "string" || patch.title === null) {
      return this.withTitle(patch.title as string | null);
    }
    return this;
  }
}
