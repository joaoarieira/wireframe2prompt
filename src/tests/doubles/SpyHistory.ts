import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

/**
 * Functional in-memory {@link IHistory} that also records its calls, so it can
 * back both "did the use case push a snapshot?" assertions and real undo/redo
 * behaviour in tests.
 */
export class SpyHistory implements IHistory {
  readonly pushCalls: WireframeDocument[] = [];
  private undoStack: WireframeDocument[] = [];
  private redoStack: WireframeDocument[] = [];

  push(snapshot: WireframeDocument): void {
    this.pushCalls.push(snapshot);
    this.undoStack.push(snapshot);
    this.redoStack = [];
  }

  undo(current: WireframeDocument): WireframeDocument | null {
    const previous = this.undoStack.pop();
    if (previous === undefined) {
      return null;
    }
    this.redoStack.push(current);
    return previous;
  }

  redo(current: WireframeDocument): WireframeDocument | null {
    const next = this.redoStack.pop();
    if (next === undefined) {
      return null;
    }
    this.undoStack.push(current);
    return next;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
