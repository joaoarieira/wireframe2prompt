import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { useEditorStore } from "../../state/app-store/appStore";
import { Button } from "../../ui/button/Button";

/** Renders a grid size as the raw `80x24` string (dimensions are data, not i18n). */
function formatGridSize(size: GridSize): string {
  return `${size.cols}x${size.rows}`;
}

/**
 * Bottom-right canvas control for the grid size. Idle: a ghost button showing
 * the current size that opens the size selector. During a resize: the same
 * size (now informational, tracking the preview) with cancel/save actions to
 * its left, discarding or applying the previewed size.
 */
export function CanvasResizeControl() {
  const { t } = useTranslation();
  const gridSize = useEditorStore((state) => state.document?.gridSize ?? null);
  const canvasResize = useEditorStore((state) => state.canvasResize);
  const beginCanvasResize = useEditorStore((state) => state.beginCanvasResize);
  const commitCanvasResize = useEditorStore(
    (state) => state.commitCanvasResize,
  );
  const cancelCanvasResize = useEditorStore(
    (state) => state.cancelCanvasResize,
  );

  if (gridSize === null) {
    return null;
  }

  if (canvasResize === null) {
    return (
      <div className="absolute right-2 bottom-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="font-mono tabular-nums"
          aria-label={t("canvas.resizeCanvas")}
          onClick={beginCanvasResize}
        >
          {formatGridSize(gridSize)}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute right-2 bottom-2 z-10 flex items-center gap-1">
      <span
        className="font-mono text-sm tabular-nums"
        data-testid="canvas-size-info"
      >
        {formatGridSize(canvasResize.previewSize)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("canvas.cancelResize")}
        onClick={cancelCanvasResize}
      >
        <X className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("canvas.saveSize")}
        onClick={commitCanvasResize}
      >
        <Check className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
