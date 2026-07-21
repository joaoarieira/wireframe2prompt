import { useTranslation } from "react-i18next";
import { ArrowLeft, Redo, Undo } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { ButtonLink } from "../../ui/button-link/ButtonLink";
import { Button } from "../../ui/button/Button";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";
import { SaveStatusIndicator } from "../LayersSidebar/SaveStatusIndicator";

/**
 * The editor's core header actions — back navigation, autosave indicator, and
 * undo/redo — as one horizontal row. Shared by the sidebar header (desktop /
 * tablet) and the phone {@link EditorTopBar} so the two arrangements never
 * duplicate the button wiring.
 */
export function EditorHeaderActions() {
  const { t } = useTranslation();
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  return (
    <>
      <ButtonLink
        to="/"
        variant="ghost"
        size="sm"
        aria-label={t("editor.backToDocuments")}
        title={t("editor.backToDocuments")}
      >
        <ArrowLeft className="size-4" aria-hidden />
      </ButtonLink>
      <SaveStatusIndicator />
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
    </>
  );
}
