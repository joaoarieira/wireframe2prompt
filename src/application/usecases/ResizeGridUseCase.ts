import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { GridSize } from "../../domain/entities/grid-size/GridSize";

export interface ResizeGridInput {
  document: WireframeDocument;
  gridSize: GridSize;
}

/** Changes the canvas grid size, recording a snapshot for undo. */
export class ResizeGridUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: ResizeGridInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.resizeGrid(input.gridSize);
  }
}
