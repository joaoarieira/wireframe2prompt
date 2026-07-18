import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Position } from "../../domain/entities/position/Position";
import { FreeDrawElement } from "../../domain/entities/element/FreeDrawElement";

export interface EraseCellInput {
  document: WireframeDocument;
  cells: readonly Position[];
}

/**
 * Erases chars from freedraw elements. For each cell, the freedraw element
 * with the highest z-index that has a char there loses that char. Elements
 * that become empty are removed from the document.
 *
 * Pure function (no history): used by the use case and the preview layer.
 * Returns the original document (by identity) when nothing was erased.
 */
export function eraseCellsOnDocument(
  document: WireframeDocument,
  cells: readonly Position[],
): WireframeDocument {
  let doc = document;
  for (const cell of cells) {
    const elements = doc.elementsByZIndex();
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!(el instanceof FreeDrawElement)) continue;
      if (el.charAt(cell) === null) continue;
      const updated = el.withoutCharAt(cell);
      doc = updated.isEmpty
        ? doc.removeElement(el.id)
        : doc.replaceElement(updated);
      break;
    }
  }
  return doc;
}

/** Erases chars from freedraw elements, recording one snapshot for undo. */
export class EraseCellUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: EraseCellInput): WireframeDocument {
    const result = eraseCellsOnDocument(input.document, input.cells);
    if (result === input.document) return input.document;
    this.history.push(input.document);
    return result;
  }
}
