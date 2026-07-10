import { CellChar } from "../../entities/cell-char/CellChar";

export interface BorderStyleParts {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

/**
 * Style used to draw box borders. Default is pure ASCII (`+ - |`), kept behind
 * this abstraction so Unicode box-drawing characters can be plugged in later
 * without touching the mappers.
 */
export class BorderStyle {
  public readonly topLeft: CellChar;
  public readonly topRight: CellChar;
  public readonly bottomLeft: CellChar;
  public readonly bottomRight: CellChar;
  public readonly horizontal: CellChar;
  public readonly vertical: CellChar;

  private constructor(parts: BorderStyleParts) {
    this.topLeft = CellChar.create(parts.topLeft);
    this.topRight = CellChar.create(parts.topRight);
    this.bottomLeft = CellChar.create(parts.bottomLeft);
    this.bottomRight = CellChar.create(parts.bottomRight);
    this.horizontal = CellChar.create(parts.horizontal);
    this.vertical = CellChar.create(parts.vertical);
  }

  static create(parts: BorderStyleParts): BorderStyle {
    return new BorderStyle(parts);
  }

  static ascii(): BorderStyle {
    return new BorderStyle({
      topLeft: "+",
      topRight: "+",
      bottomLeft: "+",
      bottomRight: "+",
      horizontal: "-",
      vertical: "|",
    });
  }

  equals(other: BorderStyle): boolean {
    return (
      this.topLeft.equals(other.topLeft) &&
      this.topRight.equals(other.topRight) &&
      this.bottomLeft.equals(other.bottomLeft) &&
      this.bottomRight.equals(other.bottomRight) &&
      this.horizontal.equals(other.horizontal) &&
      this.vertical.equals(other.vertical)
    );
  }
}
