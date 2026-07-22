import { useState } from "react";
import { ChevronUp, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";
import { CopyOutputButton } from "../CopyOutputButton/CopyOutputButton";
import { Button } from "../../ui/button/Button";
import { ButtonGroup } from "../../ui/button-group/ButtonGroup";
import { Dropdown, DropdownItem } from "../../ui/dropdown/Dropdown";
import { FloatingBar } from "../../ui/floating-bar/FloatingBar";
import { TextInput } from "../../ui/text-input/TextInput";
import { SHORTCUT_LABEL_BY_TOOL } from "../../state/keyboard/toolShortcut";
import { TOOL_ICONS } from "./toolIcons";
import { FOOTER_LAYOUT, type FooterSlot } from "./footerLayout";

/**
 * Figma-style floating bar over the bottom of the canvas: an icon tool palette
 * on the left and the copy-output action at the far end. The palette is curated
 * by {@link FOOTER_LAYOUT} — single tools plus grouped ones that expand into an
 * upward menu (e.g. box/line/arrow, pencil/eraser).
 *
 * When the pencil tool is active, an extra input picks which character it draws.
 */
export function FloatingFooter() {
  const { t } = useTranslation();
  const activeToolId = useEditorStore((state) => state.activeToolId);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const pencilChar = useEditorStore((state) => state.pencilChar);
  const setPencilChar = useEditorStore((state) => state.setPencilChar);
  const toggleLayersPanel = useEditorStore((state) => state.toggleLayersPanel);

  return (
    // Capped at the viewport so it never overflows a phone screen; the tool
    // strip scrolls horizontally while ☰ (Layers) and Copy stay pinned at the
    // end. gap tightens on small screens, widening back out on desktop.
    <FloatingBar className="absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-3 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:gap-10">
      {/* Below lg, `overflow-x-auto` lets the tools scroll on a narrow phone/
          tablet; from lg up the whole palette fits, so `lg:overflow-visible`
          drops the scroll (no scrollbar on desktop). Scrolling clips the Y axis
          (CSS forces overflow-y to auto), which would cut off a grouped tool's
          upward menu — so the grouped ToolGroups render their menu in the top
          layer (Dropdown `overlay`), escaping the clip while the strip keeps its
          scroll position and its hidden tools. `scroll-shadow-x` fades an inset
          shadow onto whichever edge still has hidden tools (and is inert once
          the strip no longer scrolls). */}
      <div className="scroll-shadow-x flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto lg:overflow-visible">
        {FOOTER_LAYOUT.map((slot) => (
          <ToolSlot
            key={slotKey(slot)}
            slot={slot}
            activeToolId={activeToolId}
            onSelect={setActiveTool}
          />
        ))}
        {activeToolId === "pencil" && (
          <TextInput
            type="text"
            aria-label={t("footer.pencilChar")}
            className="w-10 shrink-0 text-center"
            maxLength={1}
            value={pencilChar.value}
            onChange={(event) => {
              if (event.target.value.length > 0) {
                setPencilChar(event.target.value.slice(-1));
              }
            }}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* Layers toggle: only where there is no permanent sidebar (below lg). */}
        <div className="h-6 w-px bg-base-300 lg:hidden" aria-hidden />
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("footer.layers")}
          title={t("footer.layers")}
          className="lg:hidden"
          onClick={toggleLayersPanel}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <CopyOutputButton />
      </div>
    </FloatingBar>
  );
}

interface SlotProps {
  slot: FooterSlot;
  activeToolId: string;
  onSelect: (toolId: string) => void;
}

/** A single tool button, or a grouped set collapsed behind a "more" menu. */
function ToolSlot({ slot, activeToolId, onSelect }: SlotProps) {
  if (slot.kind === "single") {
    return (
      <ToolButton
        toolId={slot.toolId}
        active={activeToolId === slot.toolId}
        onSelect={onSelect}
        // btn is inline-flex, so this hides the segment on tablet/phone and
        // restores it from lg up (desktop) without touching its layout.
        className={slot.desktopOnly ? "hidden lg:inline-flex" : undefined}
      />
    );
  }
  return (
    <ToolGroup slot={slot} activeToolId={activeToolId} onSelect={onSelect} />
  );
}

interface ToolButtonProps {
  toolId: string;
  active: boolean;
  onSelect: (toolId: string) => void;
  /** Layout only; lets a ButtonGroup stamp `join-item` onto the segment. */
  className?: string;
}

/** Icon-only palette button; the tool's translated name is its accessible name. */
function ToolButton({ toolId, active, onSelect, className }: ToolButtonProps) {
  const { t } = useTranslation();
  const Icon = TOOL_ICONS[toolId];
  const label = t(`tools.${toolId}`);
  const shortcut = SHORTCUT_LABEL_BY_TOOL[toolId];
  // Screen readers get the bare tool name; the tooltip appends the shortcut.
  const title = shortcut
    ? t("footer.toolWithShortcut", { name: label, shortcut })
    : label;
  return (
    // compact: in the dense palette strip the buttons keep their btn-sm size on
    // small touch screens instead of inflating to the 44px tap floor.
    <Button
      variant={active ? "neutral" : "ghost"}
      size="sm"
      compact
      aria-pressed={active}
      aria-label={label}
      title={title}
      className={className}
      onClick={() => onSelect(toolId)}
    >
      <Icon className="size-4" aria-hidden />
    </Button>
  );
}

interface ToolGroupProps {
  slot: Extract<FooterSlot, { kind: "group" }>;
  activeToolId: string;
  onSelect: (toolId: string) => void;
}

/**
 * A split control: the left segment triggers the group's active tool (or its
 * default when none is active), the chevron opens the full member list above.
 */
function ToolGroup({ slot, activeToolId, onSelect }: ToolGroupProps) {
  const { t } = useTranslation();
  const activeInGroup = slot.toolIds.includes(activeToolId);
  // Remember the group's most recently used tool so switching to an outside
  // tool (e.g. hand) keeps that member one click away on the quick button,
  // instead of resetting the segment to the group's default. Lets the user
  // toggle between, say, line and hand without reopening the menu each time.
  const [lastUsedInGroup, setLastUsedInGroup] = useState(slot.toolIds[0]);
  if (activeInGroup && activeToolId !== lastUsedInGroup) {
    setLastUsedInGroup(activeToolId);
  }
  const shownToolId = activeInGroup ? activeToolId : lastUsedInGroup;
  return (
    <ButtonGroup>
      {/* Split-button spacing: trim the tool button's trailing padding and the
          chevron's horizontal padding (with a smaller caret) so the chevron
          reads as an attached "more" affordance, not a second full button. */}
      <ToolButton
        toolId={shownToolId}
        active={activeInGroup}
        onSelect={onSelect}
        className="pe-1"
      />
      <Dropdown
        overlay
        trigger={<ChevronUp className="size-3" aria-hidden />}
        triggerLabel={t("footer.moreTools", { name: t(slot.labelKey) })}
        triggerActive={activeInGroup}
        triggerCompact
        className="px-1"
      >
        {slot.toolIds.map((toolId) => (
          <ToolMenuItem
            key={toolId}
            toolId={toolId}
            active={activeToolId === toolId}
            onSelect={onSelect}
          />
        ))}
      </Dropdown>
    </ButtonGroup>
  );
}

interface ToolMenuItemProps {
  toolId: string;
  active: boolean;
  onSelect: (toolId: string) => void;
}

/** One tool option inside a group's expanded menu: icon plus translated name. */
function ToolMenuItem({ toolId, active, onSelect }: ToolMenuItemProps) {
  const { t } = useTranslation();
  const Icon = TOOL_ICONS[toolId];
  return (
    <DropdownItem active={active} onClick={() => onSelect(toolId)}>
      <Icon className="size-4" aria-hidden />
      {t(`tools.${toolId}`)}
    </DropdownItem>
  );
}

/** Stable React key for a slot (a group has no single tool id to key on). */
function slotKey(slot: FooterSlot): string {
  return slot.kind === "single" ? slot.toolId : slot.labelKey;
}
