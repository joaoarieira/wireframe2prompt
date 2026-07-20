import { useTranslation } from "react-i18next";
import { ArrowLeft, Redo, Save, Undo } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { ButtonLink } from "../../ui/button-link/ButtonLink";
import { Button } from "../../ui/button/Button";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";

/**
 * Top zone of the sidebar: back navigation + undo / redo / save.
 * Replaces the app-level `<header>` and `<Toolbar>` removed from EditorPage.
 */
export function LayersSidebarHeader() {
  const { t } = useTranslation();
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const saveCurrentDocument = useEditorStore((s) => s.saveCurrentDocument);

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-base-300 px-1 py-1">
      <ButtonLink
        to="/"
        variant="ghost"
        size="sm"
        aria-label={t("editor.backToDocuments")}
        title={t("editor.backToDocuments")}
      >
        <ArrowLeft className="size-4" aria-hidden />
      </ButtonLink>
      <div className="flex-1" />
      <ButtonGroup>
        <Button
          size="sm"
          variant="ghost"
          disabled={!canUndo}
          aria-label={t("toolbar.undo")}
          title={t("toolbar.undo")}
          onClick={undo}
        >
          <Undo className="size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!canRedo}
          aria-label={t("toolbar.redo")}
          title={t("toolbar.redo")}
          onClick={redo}
        >
          <Redo className="size-4" aria-hidden />
        </Button>
      </ButtonGroup>
      <Button
        size="sm"
        variant="neutral"
        aria-label={t("toolbar.save")}
        title={t("toolbar.save")}
        onClick={() => void saveCurrentDocument()}
      >
        <Save className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
