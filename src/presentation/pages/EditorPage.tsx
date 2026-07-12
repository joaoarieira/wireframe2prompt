import { Link } from "@tanstack/react-router";
import { useEditorStore } from "../state/app-store/appStore";
import { Toolbar } from "../components/Toolbar/Toolbar";
import { Canvas } from "../components/Canvas/Canvas";
import { LayersPanel } from "../components/LayersPanel/LayersPanel";
import { InspectorPanel } from "../components/InspectorPanel/InspectorPanel";
import { FloatingFooter } from "../components/FloatingFooter/FloatingFooter";

/** The editor screen: toolbar on top, layers | canvas | inspector+output. */
export function EditorPage() {
  const documentStatus = useEditorStore((state) => state.documentStatus);
  const documentName = useEditorStore((state) => state.document?.name ?? "");
  const inspectorVisible = useEditorStore(
    (state) => state.inspectorOpen && state.selectedElementId !== null,
  );

  if (documentStatus === "missing") {
    return (
      <div className="grid h-screen place-items-center">
        <div className="alert alert-warning">
          <span>Document not found.</span>
          <Link to="/" className="btn btn-sm">
            Back to documents
          </Link>
        </div>
      </div>
    );
  }

  if (documentStatus !== "ready") {
    return (
      <div className="grid h-screen place-items-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="navbar min-h-0 gap-2 bg-base-200 py-1">
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Documents
        </Link>
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
        {inspectorVisible && (
          <aside className="w-64 shrink-0 overflow-y-auto overflow-x-hidden border-l border-base-300 bg-base-200">
            <InspectorPanel />
          </aside>
        )}
        <FloatingFooter />
      </div>
    </div>
  );
}
