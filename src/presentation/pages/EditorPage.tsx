import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../state/app-store/appStore";
import { usePageMetadata, useNoIndex } from "../seo/usePageMetadata";
import { useToolShortcuts } from "../hooks/useToolShortcuts";
import { useViewportBreakpoint } from "../hooks/useViewportBreakpoint";
import { Canvas } from "../components/Canvas/Canvas";
import { LayersSidebar } from "../components/LayersSidebar/LayersSidebar";
import { LayersPanel } from "../components/LayersPanel/LayersPanel";
import { InspectorPanel } from "../components/InspectorPanel/InspectorPanel";
import { FloatingFooter } from "../components/FloatingFooter/FloatingFooter";
import { EditorContextMenu } from "../components/ContextMenu/EditorContextMenu";
import { EditorTopBar } from "../components/EditorTopBar/EditorTopBar";
import { EditorIconRail } from "../components/EditorIconRail/EditorIconRail";
import { BottomSheet } from "../ui/bottom-sheet/BottomSheet";
import { Alert } from "../ui/alert/Alert";
import { Spinner } from "../ui/spinner/Spinner";
import { ButtonLink } from "../ui/button-link/ButtonLink";

/** The editor screen: sidebar (actions + layers) | canvas | optional inspector. */
export function EditorPage() {
  const { t } = useTranslation();
  const breakpoint = useViewportBreakpoint();
  const documentStatus = useEditorStore((state) => state.documentStatus);
  const inspectorVisible = useEditorStore(
    (state) => state.inspectorOpen && state.selectedElementIds.length === 1,
  );
  const setAutoOpenInspector = useEditorStore(
    (state) => state.setAutoOpenInspector,
  );
  // On desktop the inspector is a side panel that can pop open on select; on
  // phone/tablet it's an overlay, so selecting/creating must not auto-open it —
  // the user opens it via the selection's pencil button or context-menu Edit.
  useEffect(() => {
    setAutoOpenInspector(breakpoint === "desktop");
  }, [breakpoint, setAutoOpenInspector]);
  usePageMetadata({
    titleKey: "seo.editorTitle",
    descriptionKey: "seo.editorDescription",
  });
  // The editor only ever shows the user's private local documents — keep it out
  // of the index; navigating away drops the tag so home/about stay indexable.
  useNoIndex();
  useToolShortcuts();

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

  if (breakpoint === "phone") {
    return <PhoneEditor inspectorVisible={inspectorVisible} />;
  }

  if (breakpoint === "tablet") {
    return <TabletEditor inspectorVisible={inspectorVisible} />;
  }

  return <DesktopEditor inspectorVisible={inspectorVisible} />;
}

interface EditorLayoutProps {
  inspectorVisible: boolean;
}

/**
 * Phone layout: no sidebar. A thin top bar, the full-bleed canvas, the floating
 * footer, and Layers/Inspector as bottom sheets driven by store state.
 */
function PhoneEditor({ inspectorVisible }: EditorLayoutProps) {
  const { t } = useTranslation();
  const layersPanelOpen = useEditorStore((state) => state.layersPanelOpen);
  const closeLayersPanel = useEditorStore((state) => state.closeLayersPanel);
  const closeInspector = useEditorStore((state) => state.closeInspector);

  return (
    <div className="flex h-svh flex-col overscroll-none">
      <EditorTopBar />
      <main className="relative min-h-0 flex-1">
        <Canvas />
      </main>
      <FloatingFooter />
      <EditorContextMenu />
      <BottomSheet
        open={layersPanelOpen}
        onClose={closeLayersPanel}
        label={t("layers.panelTitle")}
      >
        <LayersPanel />
      </BottomSheet>
      <BottomSheet
        open={inspectorVisible}
        onClose={closeInspector}
        label={t("inspector.sheetLabel")}
      >
        <InspectorPanel />
      </BottomSheet>
    </div>
  );
}

/**
 * Tablet layout: a slim icon rail instead of the sidebar. Layers open as a
 * left overlay over the canvas (same pattern as the right inspector); a
 * transparent backdrop over the canvas closes it, leaving the rail interactive.
 */
function TabletEditor({ inspectorVisible }: EditorLayoutProps) {
  const { t } = useTranslation();
  const layersPanelOpen = useEditorStore((state) => state.layersPanelOpen);
  const closeLayersPanel = useEditorStore((state) => state.closeLayersPanel);

  return (
    <div className="relative flex h-svh overscroll-none">
      <EditorIconRail />
      <main className="relative min-w-0 flex-1">
        <Canvas />
      </main>
      {layersPanelOpen && (
        <>
          <button
            type="button"
            aria-label={t("footer.layers")}
            className="absolute inset-y-0 right-0 left-12 z-10"
            onClick={closeLayersPanel}
          />
          <aside
            data-testid="layers-aside"
            className="absolute inset-y-0 left-12 z-20 w-56 overflow-y-auto border-r border-base-300 bg-base-200"
          >
            <LayersSidebar />
          </aside>
        </>
      )}
      {inspectorVisible && (
        <aside
          data-testid="inspector-aside"
          className="absolute inset-y-0 right-0 z-20 w-64 overflow-x-hidden overflow-y-auto border-l border-base-300 bg-base-200"
        >
          <InspectorPanel />
        </aside>
      )}
      <FloatingFooter />
      <EditorContextMenu />
    </div>
  );
}

/** Desktop layout (unchanged): sidebar | canvas | optional inspector overlay. */
function DesktopEditor({ inspectorVisible }: EditorLayoutProps) {
  return (
    // min-w-0 lets the canvas column shrink and scroll internally instead
    // of forcing a page-wide horizontal scrollbar on small screens
    <div className="relative flex h-svh overscroll-none">
      <aside className="w-56 shrink-0 border-r border-base-300 bg-base-200">
        <LayersSidebar />
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
  );
}
