import { Element } from "./Element";
import type { ElementBaseProps } from "./Element";
import type { CellChar } from "../cell-char/CellChar";
import { Position } from "../position/Position";
import { Size } from "../size/Size";
import { InvalidFreeDrawCellError } from "../errors/InvalidFreeDrawCellError";

export type FreeDrawElementProps = Omit<ElementBaseProps, "size"> & {
  cells: ReadonlyMap<string, CellChar>;
};

/** Serializes a relative (col, row) offset to a cell key. */
export function freeDrawCellKey(col: number, row: number): string {
  return `${col},${row}`;
}

function parseCellKey(key: string): { col: number; row: number } {
  const comma = key.indexOf(",");
  return {
    col: Number(key.slice(0, comma)),
    row: Number(key.slice(comma + 1)),
  };
}

function isValidCellKey(key: string): boolean {
  const parts = key.split(",");
  if (parts.length !== 2) return false;
  const col = parseInt(parts[0], 10);
  const row = parseInt(parts[1], 10);
  return (
    Number.isInteger(col) &&
    col >= 0 &&
    Number.isInteger(row) &&
    row >= 0 &&
    String(col) === parts[0] &&
    String(row) === parts[1]
  );
}

function validateCells(cells: ReadonlyMap<string, CellChar>): void {
  for (const key of cells.keys()) {
    if (!isValidCellKey(key)) {
      throw new InvalidFreeDrawCellError(key);
    }
  }
}

function computeSize(cells: ReadonlyMap<string, CellChar>): Size {
  if (cells.size === 0) return Size.create(1, 1);
  let maxCol = 0;
  let maxRow = 0;
  for (const key of cells.keys()) {
    const { col, row } = parseCellKey(key);
    if (col > maxCol) maxCol = col;
    if (row > maxRow) maxRow = row;
  }
  return Size.create(maxCol + 1, maxRow + 1);
}

function rekeyCells(
  cells: ReadonlyMap<string, CellChar>,
  deltaCol: number,
  deltaRow: number,
): Map<string, CellChar> {
  const shifted = new Map<string, CellChar>();
  for (const [key, char] of cells) {
    const { col, row } = parseCellKey(key);
    shifted.set(freeDrawCellKey(col + deltaCol, row + deltaRow), char);
  }
  return shifted;
}

/**
 * A freehand-drawn element. Cells store relative offsets from `position` so
 * that moving the element is free and the bounding box stays correct.
 * Size is always derived; `resize()` is a no-op.
 */
export class FreeDrawElement extends Element {
  readonly kind = "freedraw";
  public readonly cells: ReadonlyMap<string, CellChar>;

  private constructor(
    base: ElementBaseProps,
    cells: ReadonlyMap<string, CellChar>,
  ) {
    super(base);
    this.cells = cells;
  }

  static create(props: FreeDrawElementProps): FreeDrawElement {
    const { cells, ...baseWithoutSize } = props;
    validateCells(cells);
    const size = computeSize(cells);
    return new FreeDrawElement({ ...baseWithoutSize, size }, cells);
  }

  protected cloneWith(overrides: Partial<ElementBaseProps>): FreeDrawElement {
    return new FreeDrawElement(
      { ...this.baseProps(), ...overrides },
      this.cells,
    );
  }

  // Size is derived from content; resize is a no-op.
  override resize(_size: Size): FreeDrawElement {
    return this;
  }

  protected withKindProps(
    _patch: Readonly<Record<string, unknown>>,
  ): FreeDrawElement {
    return this;
  }

  get isEmpty(): boolean {
    return this.cells.size === 0;
  }

  charAt(cell: Position): CellChar | null {
    const relCol = cell.col - this.position.col;
    const relRow = cell.row - this.position.row;
    if (relCol < 0 || relRow < 0) return null;
    return this.cells.get(freeDrawCellKey(relCol, relRow)) ?? null;
  }

  /**
   * Adds or updates a char at an absolute grid position. If the position
   * falls to the left/above the current origin, shifts position and re-keys
   * all existing cells to maintain non-negative relative offsets.
   */
  withCharAt(cell: Position, char: CellChar): FreeDrawElement {
    let newPosition = this.position;
    let existingCells: ReadonlyMap<string, CellChar> = this.cells;

    const relColRaw = cell.col - this.position.col;
    const relRowRaw = cell.row - this.position.row;

    if (relColRaw < 0 || relRowRaw < 0) {
      const newPosCol = Math.min(this.position.col, cell.col);
      const newPosRow = Math.min(this.position.row, cell.row);
      const deltaCol = this.position.col - newPosCol;
      const deltaRow = this.position.row - newPosRow;
      existingCells = rekeyCells(this.cells, deltaCol, deltaRow);
      newPosition = Position.create(newPosCol, newPosRow);
    }

    const relCol = cell.col - newPosition.col;
    const relRow = cell.row - newPosition.row;
    const newCells = new Map(existingCells);
    newCells.set(freeDrawCellKey(relCol, relRow), char);

    const newSize = computeSize(newCells);
    return new FreeDrawElement(
      { ...this.baseProps(), position: newPosition, size: newSize },
      newCells,
    );
  }

  /**
   * Removes the char at an absolute grid position and renormalizes the bounding
   * box so the origin is always the top-left of the cells. Returns `this` if
   * no char exists at that position.
   */
  withoutCharAt(cell: Position): FreeDrawElement {
    const relCol = cell.col - this.position.col;
    const relRow = cell.row - this.position.row;

    if (relCol < 0 || relRow < 0) return this;

    const key = freeDrawCellKey(relCol, relRow);
    if (!this.cells.has(key)) return this;

    const newCells = new Map(this.cells);
    newCells.delete(key);

    if (newCells.size === 0) {
      return new FreeDrawElement(
        { ...this.baseProps(), size: Size.create(1, 1) },
        newCells,
      );
    }

    let minCol = Infinity;
    let minRow = Infinity;
    for (const k of newCells.keys()) {
      const { col, row } = parseCellKey(k);
      if (col < minCol) minCol = col;
      if (row < minRow) minRow = row;
    }

    let finalCells: ReadonlyMap<string, CellChar> = newCells;
    let finalPosition = this.position;

    if (minCol > 0 || minRow > 0) {
      finalCells = rekeyCells(newCells, -minCol, -minRow);
      finalPosition = Position.create(
        this.position.col + minCol,
        this.position.row + minRow,
      );
    }

    const newSize = computeSize(finalCells);
    return new FreeDrawElement(
      { ...this.baseProps(), position: finalPosition, size: newSize },
      finalCells,
    );
  }
}
