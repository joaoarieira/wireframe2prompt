import type { IComposer } from "../domain/ports/IComposer";
import type { IDocumentRepository } from "../domain/ports/IDocumentRepository";
import type { IHistory } from "../domain/ports/IHistory";
import type { WebStorage } from "../infrastructure/persistence/WebStorage";
import type { GlyphMapperRegistry } from "../infrastructure/composer/GlyphMapperRegistry";
import { createDefaultGlyphMapperRegistry } from "../infrastructure/composer/defaultRegistry";
import { ZIndexComposer } from "../infrastructure/composer/ZIndexComposer";
import { LocalStorageDocumentRepository } from "../infrastructure/persistence/LocalStorageDocumentRepository";
import { InMemoryHistory } from "../infrastructure/history/InMemoryHistory";
import { AddElementUseCase } from "../application/usecases/AddElementUseCase";
import { MoveElementUseCase } from "../application/usecases/MoveElementUseCase";
import { ResizeElementUseCase } from "../application/usecases/ResizeElementUseCase";
import { RemoveElementUseCase } from "../application/usecases/RemoveElementUseCase";
import { ReorderLayerUseCase } from "../application/usecases/ReorderLayerUseCase";
import { EditElementPropsUseCase } from "../application/usecases/EditElementPropsUseCase";
import { ComposeAsciiUseCase } from "../application/usecases/ComposeAsciiUseCase";
import { ExportAsciiUseCase } from "../application/usecases/ExportAsciiUseCase";
import { SaveDocumentUseCase } from "../application/usecases/SaveDocumentUseCase";
import { LoadDocumentUseCase } from "../application/usecases/LoadDocumentUseCase";
import { UndoUseCase } from "../application/usecases/UndoUseCase";
import { RedoUseCase } from "../application/usecases/RedoUseCase";
import { DrawFreeCharUseCase } from "../application/usecases/DrawFreeCharUseCase";
import { EraseCellUseCase } from "../application/usecases/EraseCellUseCase";
import { MoveElementsUseCase } from "../application/usecases/MoveElementsUseCase";
import { RemoveElementsUseCase } from "../application/usecases/RemoveElementsUseCase";
import { AddElementsUseCase } from "../application/usecases/AddElementsUseCase";

/**
 * Composition root output: the fully-wired use cases the Presentation layer
 * consumes, plus the stateful ports (history, repository, composer) it needs to
 * read directly — e.g. `history.canUndo` for a button's disabled state.
 */
export interface AppContainer {
  addElement: AddElementUseCase;
  moveElement: MoveElementUseCase;
  resizeElement: ResizeElementUseCase;
  removeElement: RemoveElementUseCase;
  reorderLayer: ReorderLayerUseCase;
  editElementProps: EditElementPropsUseCase;
  composeAscii: ComposeAsciiUseCase;
  exportAscii: ExportAsciiUseCase;
  saveDocument: SaveDocumentUseCase;
  loadDocument: LoadDocumentUseCase;
  undo: UndoUseCase;
  redo: RedoUseCase;
  drawFreeChar: DrawFreeCharUseCase;
  eraseCell: EraseCellUseCase;
  addElements: AddElementsUseCase;
  moveElements: MoveElementsUseCase;
  removeElements: RemoveElementsUseCase;
  readonly history: IHistory;
  readonly repository: IDocumentRepository;
  readonly composer: IComposer;
}

export interface ContainerOptions {
  /** Persistence adapter; defaults to the browser `localStorage`. */
  storage?: WebStorage;
  /** Glyph mapper registry; defaults to all implemented mappers. */
  registry?: GlyphMapperRegistry;
}

/**
 * Wires infrastructure implementations into the application use cases. This is
 * the only place that knows about concrete adapters — everything else depends
 * on the domain ports.
 *
 * @example
 * const app = createContainer();
 * const next = app.addElement.execute({ document, element });
 */
export function createContainer(options: ContainerOptions = {}): AppContainer {
  const registry = options.registry ?? createDefaultGlyphMapperRegistry();
  const composer = new ZIndexComposer(registry);
  const repository = new LocalStorageDocumentRepository(
    options.storage ?? browserLocalStorage(),
  );
  const history = new InMemoryHistory();

  return {
    addElement: new AddElementUseCase(history),
    moveElement: new MoveElementUseCase(history),
    resizeElement: new ResizeElementUseCase(history),
    removeElement: new RemoveElementUseCase(history),
    reorderLayer: new ReorderLayerUseCase(history),
    editElementProps: new EditElementPropsUseCase(history),
    composeAscii: new ComposeAsciiUseCase(composer),
    exportAscii: new ExportAsciiUseCase(composer),
    saveDocument: new SaveDocumentUseCase(repository),
    loadDocument: new LoadDocumentUseCase(repository),
    undo: new UndoUseCase(history),
    redo: new RedoUseCase(history),
    drawFreeChar: new DrawFreeCharUseCase(history),
    eraseCell: new EraseCellUseCase(history),
    addElements: new AddElementsUseCase(history),
    moveElements: new MoveElementsUseCase(history),
    removeElements: new RemoveElementsUseCase(history),
    history,
    repository,
    composer,
  };
}

function browserLocalStorage(): WebStorage {
  if (typeof localStorage === "undefined") {
    throw new Error(
      "localStorage is unavailable; pass options.storage to createContainer in non-browser environments",
    );
  }
  return localStorage;
}
