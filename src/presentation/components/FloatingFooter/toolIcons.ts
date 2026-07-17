import {
  AppWindow,
  Eraser,
  Hand,
  MousePointer2,
  MoveUpRight,
  PanelsTopLeft,
  PanelTop,
  PencilLine,
  Slash,
  Square,
  Table,
  Type,
  type LucideIcon,
} from "lucide-react";

/**
 * Presentation-only map from a canvas tool id to its lucide glyph. Icons are a
 * pure UI concern, so the state layer — which exposes only i18n `labelKey`s (see
 * CanvasTool) — never learns about them. Adding a tool = add its icon here and a
 * slot in {@link FOOTER_LAYOUT}.
 */
export const TOOL_ICONS: Record<string, LucideIcon> = {
  select: MousePointer2,
  hand: Hand,
  text: Type,
  box: Square,
  line: Slash,
  arrow: MoveUpRight,
  table: Table,
  modal: AppWindow,
  card: PanelTop,
  tabs: PanelsTopLeft,
  pencil: PencilLine,
  eraser: Eraser,
};
