import type { CSSProperties } from "react";
import type { MarqueeState } from "../../state/editor-store/editorStore";
import { marqueeRect } from "../../state/editor-store/editorStore";

interface MarqueeOverlayProps {
  marquee: MarqueeState;
}

/**
 * Dashed selection-rectangle drawn while a marquee drag is in progress.
 * Pointer-transparent so the grid stays fully interactive beneath it.
 */
export function MarqueeOverlay({ marquee }: MarqueeOverlayProps) {
  const rect = marqueeRect(marquee);
  return (
    <div
      className="pointer-events-none absolute border border-dashed border-primary bg-primary/10"
      data-testid="marquee-overlay"
      style={
        {
          left: `calc(var(--cell-w) * ${rect.position.col})`,
          top: `calc(var(--cell-h) * ${rect.position.row})`,
          width: `calc(var(--cell-w) * ${rect.size.width})`,
          height: `calc(var(--cell-h) * ${rect.size.height})`,
        } as CSSProperties
      }
    />
  );
}
