import { InvalidSizeError } from "../errors/InvalidSizeError";

export class Size {
  public readonly width: number;
  public readonly height: number;

  private constructor(width: number, height: number) {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new InvalidSizeError();
    }
    this.width = width;
    this.height = height;
  }

  static create(width: number, height: number): Size {
    return new Size(width, height);
  }

  equals(other: Size): boolean {
    return this.width === other.width && this.height === other.height;
  }
}
