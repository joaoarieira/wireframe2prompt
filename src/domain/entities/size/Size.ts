import { InvalidSizeError } from "../errors/InvalidSizeError";

export class Size {
  public readonly width: number;
  public readonly height: number;

  private constructor(width: number, height: number) {
    if (
      width <= 0 ||
      height <= 0 ||
      !Number.isInteger(width) ||
      !Number.isInteger(height)
    ) {
      throw new InvalidSizeError();
    }
    this.width = width;
    this.height = height;
  }

  public static create(width: number, height: number) {
    return new Size(width, height);
  }

  equals(other: Size): boolean {
    return this.width === other.width && this.height === other.height;
  }
}
