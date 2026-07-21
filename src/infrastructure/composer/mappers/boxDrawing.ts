import { CellChar } from "../../../domain/entities/cell-char/CellChar";

/**
 * Unicode box-drawing glyphs shared by the component mappers (box, card, modal,
 * table, input, dropdown, tabs, line). Kept in one place so a single edit
 * re-styles every border and no mapper hardcodes a raw character.
 *
 * @example
 * put(x, y, TOP_LEFT); // writes '┌'
 */
export const HORIZONTAL = CellChar.create("─");
export const VERTICAL = CellChar.create("│");
export const TOP_LEFT = CellChar.create("┌");
export const TOP_RIGHT = CellChar.create("┐");
export const BOTTOM_LEFT = CellChar.create("└");
export const BOTTOM_RIGHT = CellChar.create("┘");
/** `├` — vertical wall with a branch to the right (left edge of a separator). */
export const TEE_RIGHT = CellChar.create("├");
/** `┤` — vertical wall with a branch to the left (right edge of a separator). */
export const TEE_LEFT = CellChar.create("┤");
/** `┬` — horizontal wall with a branch downward (top edge of a table). */
export const TEE_DOWN = CellChar.create("┬");
/** `┴` — horizontal wall with a branch upward (bottom edge of a table). */
export const TEE_UP = CellChar.create("┴");
/** `┼` — an interior intersection where a column and a row cross. */
export const CROSS = CellChar.create("┼");
