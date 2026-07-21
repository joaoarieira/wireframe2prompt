import { EditorHeaderActions } from "./EditorHeaderActions";

/**
 * Thin full-width top bar for the phone layout: the same {@link
 * EditorHeaderActions} as the sidebar header, laid out across the top of the
 * screen since phones have no sidebar.
 */
export function EditorTopBar() {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-base-300 bg-base-200 px-1 py-1">
      <EditorHeaderActions />
    </div>
  );
}
