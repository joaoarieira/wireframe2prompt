import { ChevronUp } from "lucide-react";
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

  return (
    <FloatingBar className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-10 px-4 py-2">
      <div className="flex items-center gap-2">
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
            className="w-10 text-center"
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
      <CopyOutputButton />
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
    <Button
      variant={active ? "neutral" : "ghost"}
      size="sm"
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
  const shownToolId = activeInGroup ? activeToolId : slot.toolIds[0];
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
        trigger={<ChevronUp className="size-3" aria-hidden />}
        triggerLabel={t("footer.moreTools", { name: t(slot.labelKey) })}
        triggerActive={activeInGroup}
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
