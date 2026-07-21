import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import {
  HORIZONTAL as DASH,
  VERTICAL as PIPE,
  TOP_LEFT,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  TEE_RIGHT,
  TEE_LEFT,
} from "./boxDrawing";

const X = CellChar.create("X");

export class ModalGlyphMapper implements IGlyphMapper {
  readonly kind = "modal";

  map(element: Element): GlyphCell[] {
    const modal = element as ModalElement;
    const { col: x, row: y } = modal.position;
    const { width, height } = modal.size;
    const cells: GlyphCell[] = [];

    const put = (col: number, row: number, char: CellChar) => {
      cells.push({ position: Position.create(col, row), char });
    };

    const right = x + width - 1;
    const bottom = y + height - 1;

    // Corners
    put(x, y, TOP_LEFT);
    put(right, y, TOP_RIGHT);
    put(x, bottom, BOTTOM_LEFT);
    put(right, bottom, BOTTOM_RIGHT);

    // Top and bottom edges
    for (let col = x + 1; col < right; col++) {
      put(col, y, DASH);
      put(col, bottom, DASH);
    }

    // Left and right edges
    for (let row = y + 1; row < bottom; row++) {
      put(x, row, PIPE);
      put(right, row, PIPE);
    }

    // Title (at y+1, starting at x+2), truncated to max(0, width-6)
    if (modal.title !== null && height >= 3) {
      const maxLen = Math.max(0, width - 6);
      const visible = modal.title.slice(0, maxLen);
      for (let i = 0; i < visible.length; i++) {
        put(x + 2 + i, y + 1, CellChar.create(visible[i]));
      }
    }

    // Close button X at (x+width-3, y+1)
    if (height >= 3 && width >= 5) {
      put(x + width - 3, y + 1, X);
    }

    // Separator at y+2
    if (height >= 4) {
      put(x, y + 2, TEE_RIGHT);
      put(right, y + 2, TEE_LEFT);
      for (let col = x + 1; col < right; col++) {
        put(col, y + 2, DASH);
      }
    }

    return cells;
  }
}
