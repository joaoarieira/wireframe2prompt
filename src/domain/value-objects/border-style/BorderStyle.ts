import { CellChar } from "../../entities/cell-char/CellChar";

export interface BorderStyleParts {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  /** `├` — vertical wall branching right (left end of a separator). */
  teeRight: string;
  /** `┤` — vertical wall branching left (right end of a separator). */
  teeLeft: string;
  /** `┬` — horizontal wall branching down (top edge of a table). */
  teeDown: string;
  /** `┴` — horizontal wall branching up (bottom edge of a table). */
  teeUp: string;
  /** `┼` — an interior intersection where a column and a row cross. */
  cross: string;
}

/** The three named border styles the UI offers. `square` is the default. */
export type BorderStyleName = "square" | "rounded" | "cross";

/**
 * The complete box-drawing glyph set used to draw an element's border: four
 * corners, the two edge strokes, and the four tees plus the cross for interior
 * junctions (tables, separators). Kept behind this abstraction so a border can
 * be re-styled (square ↔ rounded ↔ cross) without any mapper hardcoding a glyph.
 *
 * @example
 * BorderStyle.rounded(); // ╭ ╮ ╰ ╯ with the unicode edges/tees
 */
export class BorderStyle {
  public readonly topLeft: CellChar;
  public readonly topRight: CellChar;
  public readonly bottomLeft: CellChar;
  public readonly bottomRight: CellChar;
  public readonly horizontal: CellChar;
  public readonly vertical: CellChar;
  public readonly teeRight: CellChar;
  public readonly teeLeft: CellChar;
  public readonly teeDown: CellChar;
  public readonly teeUp: CellChar;
  public readonly cross: CellChar;

  private constructor(parts: BorderStyleParts) {
    this.topLeft = CellChar.create(parts.topLeft);
    this.topRight = CellChar.create(parts.topRight);
    this.bottomLeft = CellChar.create(parts.bottomLeft);
    this.bottomRight = CellChar.create(parts.bottomRight);
    this.horizontal = CellChar.create(parts.horizontal);
    this.vertical = CellChar.create(parts.vertical);
    this.teeRight = CellChar.create(parts.teeRight);
    this.teeLeft = CellChar.create(parts.teeLeft);
    this.teeDown = CellChar.create(parts.teeDown);
    this.teeUp = CellChar.create(parts.teeUp);
    this.cross = CellChar.create(parts.cross);
  }

  static create(parts: BorderStyleParts): BorderStyle {
    return new BorderStyle(parts);
  }

  /** The default style: unicode box-drawing with square corners (`┌ ┐ └ ┘`). */
  static square(): BorderStyle {
    return new BorderStyle({
      topLeft: "┌",
      topRight: "┐",
      bottomLeft: "└",
      bottomRight: "┘",
      horizontal: "─",
      vertical: "│",
      teeRight: "├",
      teeLeft: "┤",
      teeDown: "┬",
      teeUp: "┴",
      cross: "┼",
    });
  }

  /** Like {@link square} but with arc corners (`╭ ╮ ╰ ╯`); the rest is unchanged. */
  static rounded(): BorderStyle {
    return new BorderStyle({
      topLeft: "╭",
      topRight: "╮",
      bottomLeft: "╰",
      bottomRight: "╯",
      horizontal: "─",
      vertical: "│",
      teeRight: "├",
      teeLeft: "┤",
      teeDown: "┬",
      teeUp: "┴",
      cross: "┼",
    });
  }

  /** Pure ASCII: `+` for every corner/junction, `-`/`|` for the edges. */
  static cross(): BorderStyle {
    return new BorderStyle({
      topLeft: "+",
      topRight: "+",
      bottomLeft: "+",
      bottomRight: "+",
      horizontal: "-",
      vertical: "|",
      teeRight: "+",
      teeLeft: "+",
      teeDown: "+",
      teeUp: "+",
      cross: "+",
    });
  }

  /** Builds one of the three named styles. */
  static named(name: BorderStyleName): BorderStyle {
    if (name === "rounded") return BorderStyle.rounded();
    if (name === "cross") return BorderStyle.cross();
    return BorderStyle.square();
  }

  /**
   * The name of a style, or `null` when it matches none of the three named ones
   * (e.g. a hand-built custom style). Used to render the current selection.
   */
  static nameOf(style: BorderStyle): BorderStyleName | null {
    if (style.equals(BorderStyle.square())) return "square";
    if (style.equals(BorderStyle.rounded())) return "rounded";
    if (style.equals(BorderStyle.cross())) return "cross";
    return null;
  }

  equals(other: BorderStyle): boolean {
    return (
      this.topLeft.equals(other.topLeft) &&
      this.topRight.equals(other.topRight) &&
      this.bottomLeft.equals(other.bottomLeft) &&
      this.bottomRight.equals(other.bottomRight) &&
      this.horizontal.equals(other.horizontal) &&
      this.vertical.equals(other.vertical) &&
      this.teeRight.equals(other.teeRight) &&
      this.teeLeft.equals(other.teeLeft) &&
      this.teeDown.equals(other.teeDown) &&
      this.teeUp.equals(other.teeUp) &&
      this.cross.equals(other.cross)
    );
  }
}
