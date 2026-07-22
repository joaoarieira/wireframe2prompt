import { Check, MoveHorizontal, MoveVertical, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { useEditorStore } from "../../state/app-store/appStore";
import { Button } from "../../ui/button/Button";
import { TextInput } from "../../ui/text-input/TextInput";

/** Renders a grid size as the raw `80x24` string (dimensions are data, not i18n). */
function formatGridSize(size: GridSize): string {
  return `${size.cols}x${size.rows}`;
}

/** Parses an input value to a positive integer, or null if it isn't one. */
function parseDimension(text: string): number | null {
  const value = Number(text);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * Bottom-right canvas control for the grid size. Idle: a ghost button showing
 * the current size that opens the size selector. During a resize:
 * {@link CanvasSizeEditor} — width/height inputs (also driven by the handle
 * drag) with cancel/save actions.
 */
export function CanvasResizeControl() {
  const { t } = useTranslation();
  const gridSize = useEditorStore((state) => state.document?.gridSize ?? null);
  const previewSize = useEditorStore(
    (state) => state.canvasResize?.previewSize ?? null,
  );
  const beginCanvasResize = useEditorStore((state) => state.beginCanvasResize);

  if (gridSize === null) {
    return null;
  }

  if (previewSize === null) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="font-mono tabular-nums"
        aria-label={t("canvas.resizeCanvas")}
        onClick={beginCanvasResize}
      >
        {formatGridSize(gridSize)}
      </Button>
    );
  }

  return <CanvasSizeEditor previewSize={previewSize} />;
}

/**
 * Width/height number inputs that edit the previewed grid size. Typing a valid
 * (positive integer) value publishes it to the store, live-resizing the paper.
 *
 * The fields show `previewSize` directly, so a handle drag that moves it flows
 * straight through. The local `*Override` state only holds an *invalid*
 * in-progress value (empty / non-positive), which has nothing to publish —
 * once the text is valid we drop the override, since `previewSize` then equals
 * it. This keeps the display in sync without a setState-in-effect.
 */
function CanvasSizeEditor({ previewSize }: { previewSize: GridSize }) {
  const { t } = useTranslation();
  const setPreview = useEditorStore((state) => state.setCanvasResizePreview);
  const commit = useEditorStore((state) => state.commitCanvasResize);
  const cancel = useEditorStore((state) => state.cancelCanvasResize);
  const [widthOverride, setWidthOverride] = useState<string | null>(null);
  const [heightOverride, setHeightOverride] = useState<string | null>(null);

  const changeWidth = (text: string) => {
    const cols = parseDimension(text);
    setWidthOverride(cols === null ? text : null);
    if (cols !== null) setPreview(GridSize.create(cols, previewSize.rows));
  };

  const changeHeight = (text: string) => {
    const rows = parseDimension(text);
    setHeightOverride(rows === null ? text : null);
    if (rows !== null) setPreview(GridSize.create(previewSize.cols, rows));
  };

  return (
    <div className="flex items-center gap-2" data-testid="canvas-size-info">
      <label className="flex items-center gap-1">
        <MoveHorizontal className="size-4" aria-hidden />
        <TextInput
          type="number"
          min={1}
          value={widthOverride ?? String(previewSize.cols)}
          onChange={(event) => changeWidth(event.target.value)}
          aria-label={t("canvas.width")}
          className="w-16 font-mono tabular-nums"
        />
      </label>
      <label className="flex items-center gap-1">
        <MoveVertical className="size-4" aria-hidden />
        <TextInput
          type="number"
          min={1}
          value={heightOverride ?? String(previewSize.rows)}
          onChange={(event) => changeHeight(event.target.value)}
          aria-label={t("canvas.height")}
          className="w-16 font-mono tabular-nums"
        />
      </label>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("canvas.cancelResize")}
        onClick={cancel}
      >
        <X className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t("canvas.saveSize")}
        onClick={commit}
      >
        <Check className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
