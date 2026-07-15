import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { CopyOutputButton } from "../CopyOutputButton/CopyOutputButton";

/**
 * Figma-style floating bar over the bottom of the canvas: the tool palette on
 * the left and the copy-output action at the far end. Tools come from the
 * store's registry, so future tools (hand, zoom, pencil…) show up here
 * automatically.
 */
export function FloatingFooter() {
  const { t } = useTranslation();
  const listTools = useEditorStore((state) => state.listTools);
  const activeToolId = useEditorStore((state) => state.activeToolId);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const tools = useMemo(() => listTools(), [listTools]);

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-10 rounded-box border border-base-300 bg-base-100 px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            // the filled (neutral) button marks what a canvas click will do
            className={`btn btn-sm ${tool.id === activeToolId ? "btn-neutral" : "btn-ghost"}`}
            aria-pressed={tool.id === activeToolId}
            onClick={() => setActiveTool(tool.id)}
          >
            {t(tool.labelKey)}
          </button>
        ))}
      </div>
      <CopyOutputButton />
    </div>
  );
}
