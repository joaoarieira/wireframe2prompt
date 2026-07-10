import type { WireframeDocument } from "../aggregates/wireframe-document/WireframeDocument";

/**
 * Undo/redo port using a snapshot strategy: before a mutation, the previous
 * document is pushed. `undo`/`redo` move the given "current" document across the
 * undo and redo stacks and return the document to restore (or `null` when the
 * corresponding stack is empty).
 */
export interface IHistory {
  push(snapshot: WireframeDocument): void;
  undo(current: WireframeDocument): WireframeDocument | null;
  redo(current: WireframeDocument): WireframeDocument | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}
