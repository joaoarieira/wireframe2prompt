import { useTranslation } from "react-i18next";
import { useEditorStore } from "../state/app-store/appStore";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { Canvas } from "../components/Canvas/Canvas";
import { LayersPanel } from "../components/LayersPanel/LayersPanel";
import { InspectorPanel } from "../components/InspectorPanel/InspectorPanel";
import { FloatingFooter } from "../components/FloatingFooter/FloatingFooter";
import { EditorContextMenu } from "../components/ContextMenu/EditorContextMenu";
import { Alert } from "../ui/alert/Alert";
import { Spinner } from "../ui/spinner/Spinner";
import { ButtonLink } from "../ui/button-link/ButtonLink";

/** The editor screen: toolbar on top, layers | canvas | inspector+output. */
export function EditorPage() {
  const { t } = useTranslation();
  const documentStatus = useEditorStore((state) => state.documentStatus);
  const documentName = useEditorStore((state) => state.document?.name ?? "");
  const inspectorVisible = useEditorStore(
    (state) => state.inspectorOpen && state.selectedElementIds.length === 1,
  );

  if (documentStatus === "missing") {
    return (
      <div className="grid h-screen place-items-center">
        <Alert variant="warning">
          <span>{t("editor.notFound")}</span>
          <ButtonLink to="/" size="sm">
            {t("editor.backToDocuments")}
          </ButtonLink>
        </Alert>
      </div>
    );
  }

  if (documentStatus !== "ready") {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 bg-base-200 px-2 py-1">
        <ButtonLink to="/" variant="ghost" size="sm">
          {t("editor.documentsShort")}
        </ButtonLink>
        <span className="text-sm font-bold">{documentName}</span>
      </header>
      <Toolbar />
      {/* min-w-0 lets the canvas column shrink and scroll internally instead
          of forcing a page-wide horizontal scrollbar on small screens */}
      <div className="relative flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-auto border-r border-base-300 bg-base-200">
          <LayersPanel />
        </aside>
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>
        {/* Overlaid (absolute) instead of a flex column on purpose: opening it
            must not reflow the canvas. A double click selects on the first
            click, the inspector opens, and if the canvas shifted left the
            element would escape the pointer before the second click. */}
        {inspectorVisible && (
          <aside
            data-testid="inspector-aside"
            className="absolute inset-y-0 right-0 w-64 overflow-x-hidden overflow-y-auto border-l border-base-300 bg-base-200"
          >
            <InspectorPanel />
          </aside>
        )}
        <FloatingFooter />
        <EditorContextMenu />
      </div>
    </div>
  );
}
