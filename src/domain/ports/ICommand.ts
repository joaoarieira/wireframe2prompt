import type { WireframeDocument } from "../aggregates/wireframe-document/WireframeDocument";

/**
 * Reversible command over a document. The MVP uses the snapshot strategy in
 * {@link IHistory}, so this port is the seam for a future diff-based command
 * history (smaller memory footprint) without changing the use cases.
 */
export interface ICommand {
  execute(document: WireframeDocument): WireframeDocument;
  undo(document: WireframeDocument): WireframeDocument;
}
