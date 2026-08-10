import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import type { Position } from "../position/Position";
import type { TitledElement } from "./TitledElement";
import type { TitleRegion } from "./titleGeometry";
import { isTitleCell, titleRegion } from "./titleGeometry";

export interface CardElementProps extends ElementBaseProps {
  title: string | null;
}

/** Border plus one pad column on each side, matching CardGlyphMapper. */
const TITLE_RESERVED_COLS = 4;

export class CardElement extends Element implements TitledElement {
  readonly kind = "card";
  public readonly title: string | null;

  get hasBorder(): boolean {
    return true;
  }

  private constructor(base: ElementBaseProps, title: string | null) {
    super(base);
    this.title = title;
  }

  static create(props: CardElementProps): CardElement {
    const { title, ...base } = props;
    return new CardElement(base, title);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): CardElement {
    return new CardElement({ ...this.baseProps(), ...overrides }, this.title);
  }

  withTitle(title: string | null): CardElement {
    return new CardElement(this.baseProps(), title);
  }

  /** Editable region of the title (second row), left-anchored. */
  titleRegion(): TitleRegion {
    return titleRegion(this.position, this.size, TITLE_RESERVED_COLS);
  }

  /** Whether a cell sits on the title row, for canvas double-click editing. */
  titleAtCell(cell: Position): boolean {
    return isTitleCell(this.position, this.size, cell);
  }

  protected withKindProps(
    patch: Readonly<Record<string, unknown>>,
  ): CardElement {
    if (typeof patch.title === "string" || patch.title === null) {
      return this.withTitle(patch.title as string | null);
    }
    return this;
  }
}
