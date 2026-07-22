/**
 * How the tool palette is arranged in the {@link FloatingFooter}.
 *
 * Presentation-only: the {@link ToolRegistry} stays a flat, open/closed list;
 * this file curates which tools sit alone and which collapse into an upward
 * "more" menu. Order follows the agreed wireframe:
 * `select · hand · text · shapes · containers · draw · [copy]`.
 */
export type FooterSlot =
  | {
      readonly kind: "single";
      readonly toolId: string;
      /**
       * Shown only from `lg` up (desktop). Used for tools that are redundant on
       * touch: the hand/pan tool duplicates a phone/tablet's native touch pan.
       */
      readonly desktopOnly?: boolean;
    }
  | {
      readonly kind: "group";
      /** i18n key for the group's name (used in the trigger's aria-label). */
      readonly labelKey: string;
      /** Group members; the first is the trigger's default when none is active. */
      readonly toolIds: readonly string[];
    };

export const FOOTER_LAYOUT: readonly FooterSlot[] = [
  { kind: "single", toolId: "select" },
  { kind: "single", toolId: "hand", desktopOnly: true },
  { kind: "single", toolId: "text" },
  {
    kind: "group",
    labelKey: "footer.shapes",
    toolIds: ["box", "line", "multiline", "arrow"],
  },
  {
    kind: "group",
    labelKey: "footer.containers",
    toolIds: ["input", "dropdown", "table", "modal", "card", "tabs"],
  },
  {
    kind: "group",
    labelKey: "footer.draw",
    toolIds: ["pencil", "eraser"],
  },
];
