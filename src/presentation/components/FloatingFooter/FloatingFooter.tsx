import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { CopyOutputButton } from "../CopyOutputButton/CopyOutputButton";
import { Button } from "../../ui/button/Button";
import { FloatingBar } from "../../ui/floating-bar/FloatingBar";

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
    <FloatingBar className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-10 px-4 py-2">
      <div className="flex items-center gap-2">
        {tools.map((tool) => {
          const isActive = tool.id === activeToolId;
          return (
            <Button
              key={tool.id}
              // the filled (neutral) button marks what a canvas click will do
              variant={isActive ? "neutral" : "ghost"}
              size="sm"
              aria-pressed={isActive}
              onClick={() => setActiveTool(tool.id)}
            >
              {t(tool.labelKey)}
            </Button>
          );
        })}
      </div>
      <CopyOutputButton />
    </FloatingBar>
  );
}
