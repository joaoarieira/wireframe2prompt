import { useTranslation } from "react-i18next";
import { ArrowLeft, Menu, Redo, Undo } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { ButtonLink } from "../../ui/button-link/ButtonLink";
import { Button } from "../../ui/button/Button";
import { SaveStatusIndicator } from "../LayersSidebar/SaveStatusIndicator";

/**
 * The tablet layout's ~48px left rail: back navigation, a compact save-status
 * dot, undo/redo, and the ☰ toggle that reveals the Layers panel over the
 * canvas. The permanent sidebar of the desktop layout is replaced by this rail
 * plus the on-demand overlay.
 */
export function EditorIconRail() {
  const { t } = useTranslation();
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const toggleLayersPanel = useEditorStore((s) => s.toggleLayersPanel);

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-base-300 bg-base-200 py-1">
      <ButtonLink
        to="/"
        variant="ghost"
        size="sm"
        aria-label={t("editor.backToDocuments")}
        title={t("editor.backToDocuments")}
      >
        <ArrowLeft className="size-4" aria-hidden />
      </ButtonLink>
      <SaveStatusIndicator compact />
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
      <Button
        size="sm"
        variant="ghost"
        aria-label={t("footer.layers")}
        title={t("footer.layers")}
        onClick={toggleLayersPanel}
      >
        <Menu className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
