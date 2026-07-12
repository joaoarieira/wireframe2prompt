import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

/**
 * In-memory {@link IHistory} using the snapshot strategy: `push` stores the
 * previous document on the undo stack (and clears the redo stack), while
 * `undo`/`redo` shuttle the given "current" document between the two stacks.
 *
 * It is the production counterpart of the test `SpyHistory`, minus the
 * call-recording that only the tests need.
 */
export class InMemoryHistory implements IHistory {
  private undoStack: WireframeDocument[] = [];
  private redoStack: WireframeDocument[] = [];

  push(snapshot: WireframeDocument): void {
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

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
