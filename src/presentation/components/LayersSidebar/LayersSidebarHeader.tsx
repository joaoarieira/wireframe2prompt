import { EditorHeaderActions } from "../EditorTopBar/EditorHeaderActions";

/**
 * Top zone of the sidebar: back navigation + undo / redo + the autosave
 * status. Wraps the shared {@link EditorHeaderActions} in the sidebar's
 * bordered strip.
 */
export function LayersSidebarHeader() {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-base-300 px-1 py-1">
      <EditorHeaderActions />
    </div>
  );
}
