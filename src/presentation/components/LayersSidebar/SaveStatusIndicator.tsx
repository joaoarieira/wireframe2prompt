import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { Spinner } from "../../ui/spinner/Spinner";

interface SaveStatusIndicatorProps {
  /**
   * Icon-only mode for the tablet icon rail: drops the text label and moves it
   * onto the `title` so the status still fits a ~48px column.
   */
  compact?: boolean;
}

/**
 * Passive autosave indicator replacing the old manual Save button: hidden for
 * an untouched wireframe, then "Saving" while the autosave runs and "Saved"
 * once it lands. Read-only — saving is triggered by the store's idle timer.
 *
 * @example <SaveStatusIndicator />
 */
export function SaveStatusIndicator({
  compact = false,
}: SaveStatusIndicatorProps) {
  const { t } = useTranslation();
  const saveStatus = useEditorStore((s) => s.saveStatus);

  if (saveStatus === "hidden") {
    return null;
  }
  const label = t(saveStatus === "saving" ? "toolbar.saving" : "toolbar.saved");
  const icon =
    saveStatus === "saving" ? (
      <Spinner size="xs" />
    ) : (
      <Check className="size-3.5" aria-hidden />
    );
  if (compact) {
    return (
      <span
        className="flex items-center justify-center text-base-content/70"
        title={label}
        aria-label={label}
      >
        {icon}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2 text-xs text-base-content/70">
      {icon}
      {label}
    </span>
  );
}
