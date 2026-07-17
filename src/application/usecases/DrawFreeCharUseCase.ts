import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Position } from "../../domain/entities/position/Position";
import type { CellChar } from "../../domain/entities/cell-char/CellChar";
import { FreeDrawElement } from "../../domain/entities/element/FreeDrawElement";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";
import { InvalidFreeDrawTargetError } from "../../domain/entities/errors/InvalidFreeDrawTargetError";

export interface DrawFreeCharInput {
  document: WireframeDocument;
  elementId: string;
  cells: ReadonlyArray<{ position: Position; char: CellChar }>;
}

/**
 * Applies draw cells to a freedraw element, returning the updated document.
 * Pure function (no history): used by the use case and the preview layer.
 * Validates element existence and kind; cells must be non-empty.
 */
export function drawCellsOnDocument(
  document: WireframeDocument,
  elementId: string,
  cells: ReadonlyArray<{ position: Position; char: CellChar }>,
): WireframeDocument {
  const element = document.getElement(elementId);
  if (element === undefined) throw new ElementNotFoundError(elementId);
  if (!(element instanceof FreeDrawElement)) {
    throw new InvalidFreeDrawTargetError(elementId, element.kind);
  }
  let updated: FreeDrawElement = element;
  for (const { position, char } of cells) {
    updated = updated.withCharAt(position, char);
  }
  return document.replaceElement(updated);
}

/** Draws chars onto a freedraw element, recording a snapshot for undo. */
export class DrawFreeCharUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: DrawFreeCharInput): WireframeDocument {
    const element = input.document.getElement(input.elementId);
    if (element === undefined) throw new ElementNotFoundError(input.elementId);
    if (!(element instanceof FreeDrawElement)) {
      throw new InvalidFreeDrawTargetError(input.elementId, element.kind);
    }
    if (input.cells.length === 0) return input.document;
    this.history.push(input.document);
    return drawCellsOnDocument(input.document, input.elementId, input.cells);
  }
}
