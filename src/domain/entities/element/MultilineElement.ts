import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import { Position } from "../position/Position";
import { Size } from "../size/Size";
import { InvalidMultilinePointError } from "../errors/InvalidMultilinePointError";

/** A polyline vertex. During construction these are absolute grid coordinates;
 * once stored on the element they are offsets relative to `position`. */
export interface MultilinePoint {
  readonly col: number;
  readonly row: number;
}

export type MultilineElementProps = Omit<
  ElementBaseProps,
  "size" | "position"
> & {
  /** Ordered vertices in absolute grid coordinates; >= 2 and axis-aligned. */
  points: readonly MultilinePoint[];
};

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

/**
 * A vertex list only draws as connected orthogonal strokes when every segment
 * runs along a single axis, so we reject diagonals, repeats and short paths at
 * construction rather than let the mapper produce garbage.
 */
function validatePoints(points: readonly MultilinePoint[]): void {
  if (points.length < 2) {
    throw new InvalidMultilinePointError(`got ${points.length} point(s)`);
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!isInteger(point.col) || !isInteger(point.row)) {
      throw new InvalidMultilinePointError(
        `point ${i} = (${point.col}, ${point.row}) is not integral`,
      );
    }
    if (i === 0) continue;
    const prev = points[i - 1];
    const sameCol = prev.col === point.col;
    const sameRow = prev.row === point.row;
    if (sameCol && sameRow) {
      throw new InvalidMultilinePointError(
        `points ${i - 1} and ${i} are identical (${point.col}, ${point.row})`,
      );
    }
    if (!sameCol && !sameRow) {
      throw new InvalidMultilinePointError(
        `segment ${i - 1}→${i} from (${prev.col}, ${prev.row}) to (${point.col}, ${point.row}) is diagonal`,
      );
    }
  }
}

function topLeftOf(points: readonly MultilinePoint[]): Position {
  let minCol = points[0].col;
  let minRow = points[0].row;
  for (const point of points) {
    if (point.col < minCol) minCol = point.col;
    if (point.row < minRow) minRow = point.row;
  }
  return Position.create(minCol, minRow);
}

function boundingSize(relative: readonly MultilinePoint[]): Size {
  let maxCol = 0;
  let maxRow = 0;
  for (const point of relative) {
    if (point.col > maxCol) maxCol = point.col;
    if (point.row > maxRow) maxRow = point.row;
  }
  return Size.create(maxCol + 1, maxRow + 1);
}

/**
 * A connected orthogonal polyline drawn with a single mouse drag. Vertices are
 * stored relative to `position` (like {@link FreeDrawElement}'s cells) so moving
 * the element is free and its bounding box stays correct. Size is always derived
 * from the vertices; `resize()` is a no-op.
 *
 * @example
 * MultilineElement.create({ id, zIndex: 0, layerId: null,
 *   points: [{ col: 2, row: 1 }, { col: 6, row: 1 }, { col: 6, row: 4 }] });
 */
export class MultilineElement extends Element {
  readonly kind = "multiline";
  /** Vertices relative to `position`; length >= 2, each segment axis-aligned. */
  public readonly points: readonly MultilinePoint[];

  private constructor(
    base: ElementBaseProps,
    points: readonly MultilinePoint[],
  ) {
    super(base);
    this.points = points;
  }

  static create(props: MultilineElementProps): MultilineElement {
    const { points, ...rest } = props;
    validatePoints(points);
    const origin = topLeftOf(points);
    const relative = points.map((point) => ({
      col: point.col - origin.col,
      row: point.row - origin.row,
    }));
    return new MultilineElement(
      { ...rest, position: origin, size: boundingSize(relative) },
      relative,
    );
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): MultilineElement {
    return new MultilineElement(
      { ...this.baseProps(), ...overrides },
      this.points,
    );
  }

  // The polyline strokes and corners are drawn from a BorderStyle, so square ↔
  // rounded ↔ cross applies to it just like a box.
  override get hasBorder(): boolean {
    return true;
  }

  // Size is derived from the vertices; resize is a no-op (mirrors FreeDraw).
  override resize(_size: Size): MultilineElement {
    return this;
  }

  protected withKindProps(
    _patch: Readonly<Record<string, unknown>>,
  ): MultilineElement {
    return this;
  }

  /** The vertices in absolute grid coordinates (position + relative offset). */
  absolutePoints(): Position[] {
    return this.points.map((point) =>
      Position.create(
        this.position.col + point.col,
        this.position.row + point.row,
      ),
    );
  }
}
