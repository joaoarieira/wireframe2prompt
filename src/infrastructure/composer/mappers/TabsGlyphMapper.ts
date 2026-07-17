import type { IGlyphMapper, GlyphCell } from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { TabsElement } from "../../../domain/entities/element/TabsElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const PIPE = CellChar.create("|");
const DASH = CellChar.create("-");

export class TabsGlyphMapper implements IGlyphMapper {
  readonly kind = "tabs";

  map(element: Element): GlyphCell[] {
    const tabsEl = element as TabsElement;
    const { col: x, row: y } = tabsEl.position;
    const { width, height } = tabsEl.size;
    const end = x + width;
    const cells: GlyphCell[] = [];

    // Tab headers row
    let col = x;
    for (let i = 0; i < tabsEl.tabs.length; i++) {
      if (col >= end) break;
      // Separator between tabs
      if (i > 0) {
        cells.push({ position: Position.create(col, y), char: PIPE });
        col++;
        if (col >= end) break;
      }
      const label = tabsEl.tabs[i];
      const segment = i === tabsEl.active ? `[${label}]` : ` ${label} `;
      for (const char of segment) {
        if (col >= end) break;
        cells.push({ position: Position.create(col, y), char: CellChar.create(char) });
        col++;
      }
    }

    // Bottom underline
    if (height >= 2) {
      for (let c = x; c < end; c++) {
        cells.push({ position: Position.create(c, y + 1), char: DASH });
      }
    }

    return cells;
  }
}
