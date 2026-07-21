import { Frame, Square, SquareRoundCorner } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BorderStyleName } from "../../../domain/value-objects/border-style/BorderStyle";
import { useEditorStore } from "../../state/app-store/appStore";
import { Dropdown, DropdownItem } from "../../ui/dropdown/Dropdown";

/** Menu order of the three styles. */
const BORDER_ORDER: readonly BorderStyleName[] = ["square", "rounded", "cross"];

/** Lucide icon standing in for each style's shape. */
const BORDER_ICON: Record<BorderStyleName, LucideIcon> = {
  square: Square,
  rounded: SquareRoundCorner,
  cross: Frame,
};

/**
 * Bottom-left-of-the-resize-control button that picks the border style applied
 * to newly placed elements. The trigger shows the current default's shape icon;
 * the menu lists the three styles under a header.
 */
export function DefaultBorderControl() {
  const { t } = useTranslation();
  const hasDocument = useEditorStore((state) => state.document !== null);
  const defaultBorderStyleName = useEditorStore(
    (state) => state.defaultBorderStyleName,
  );
  const setDefaultBorderStyleName = useEditorStore(
    (state) => state.setDefaultBorderStyleName,
  );

  if (!hasDocument) {
    return null;
  }

  const TriggerIcon = BORDER_ICON[defaultBorderStyleName];

  return (
    <Dropdown
      trigger={<TriggerIcon className="size-4" aria-hidden />}
      triggerLabel={t("canvas.defaultBorder")}
      menuLabel={t("canvas.defaultBorder")}
    >
      {BORDER_ORDER.map((name) => {
        const Icon = BORDER_ICON[name];
        return (
          <DropdownItem
            key={name}
            active={name === defaultBorderStyleName}
            onClick={() => setDefaultBorderStyleName(name)}
          >
            <Icon className="size-4" aria-hidden /> {t(`borderStyle.${name}`)}
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
