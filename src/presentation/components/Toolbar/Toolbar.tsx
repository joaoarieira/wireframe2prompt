import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { Button } from "../../ui/button/Button";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";

/**
 * History and persistence actions. The tool palette lives in the
 * FloatingFooter over the canvas.
 */
export function Toolbar() {
  const { t } = useTranslation();
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const saveCurrentDocument = useEditorStore(
    (state) => state.saveCurrentDocument,
  );

  return (
    <div className="flex items-center gap-4 border-b border-base-300 bg-base-200 px-4 py-2">
      <ButtonGroup>
        <Button size="sm" disabled={!canUndo} onClick={undo}>
          {t("toolbar.undo")}
        </Button>
        <Button size="sm" disabled={!canRedo} onClick={redo}>
          {t("toolbar.redo")}
        </Button>
      </ButtonGroup>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => void saveCurrentDocument()}
      >
        {t("toolbar.save")}
      </Button>
    </div>
  );
}
