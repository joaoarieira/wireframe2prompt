import { CellChar } from "../cell-char/CellChar";
import { GridSize } from "../grid-size/GridSize";
import { Position } from "../position/Position";

export class CharBuffer {
  private readonly cells: CellChar[][];
  private readonly grid: GridSize;

  private constructor(grid: GridSize) {
    this.grid = grid;
    this.cells = [];
    for (let i = 0; i < grid.rows; i++) {
      this.cells.push([]);
      for (let j = 0; j < grid.cols; j++) {
        this.cells[i].push(CellChar.create(" "));
      }
    }
  }

  public static create(grid: GridSize) {
    return new CharBuffer(grid);
  }

  public setChar(position: Position, char: CellChar): void {
    if (!this.grid.contains(position)) {
      return; // clamp: fora do grid é ignorado silenciosamente
    }
    this.cells[position.row][position.col] = char;
  }

  public toString(): string {
    return this.cells
      .map((row) => row.map((cell) => cell.value).join(""))
      .join("\n");
  }
}
