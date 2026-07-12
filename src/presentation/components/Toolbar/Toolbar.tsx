import { useEditorStore } from "../../state/app-store/appStore";

/**
 * History and persistence actions. The tool palette lives in the
 * FloatingFooter over the canvas.
 */
export function Toolbar() {
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const saveCurrentDocument = useEditorStore(
    (state) => state.saveCurrentDocument,
  );

  return (
    <div className="flex items-center gap-4 border-b border-base-300 bg-base-200 px-4 py-2">
      <div className="join">
        <button
          type="button"
          className="btn join-item btn-sm"
          disabled={!canUndo}
          onClick={undo}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn join-item btn-sm"
          disabled={!canRedo}
          onClick={redo}
        >
          Redo
        </button>
      </div>
      <button
        type="button"
        className="btn btn-neutral btn-sm"
        onClick={() => void saveCurrentDocument()}
      >
        Save
      </button>
    </div>
  );
}
