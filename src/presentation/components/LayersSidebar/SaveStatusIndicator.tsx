import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { Spinner } from "../../ui/spinner/Spinner";

/**
 * Passive autosave indicator replacing the old manual Save button: hidden for
 * an untouched wireframe, then "Saving" while the autosave runs and "Saved"
 * once it lands. Read-only — saving is triggered by the store's idle timer.
 *
 * @example <SaveStatusIndicator />
 */
export function SaveStatusIndicator() {
  const { t } = useTranslation();
  const saveStatus = useEditorStore((s) => s.saveStatus);

  if (saveStatus === "hidden") {
    return null;
  }
  return (
    <span className="flex items-center gap-1.5 px-2 text-xs text-base-content/70">
      {saveStatus === "saving" ? (
        <Spinner size="xs" />
      ) : (
        <Check className="size-3.5" aria-hidden />
      )}
      {t(saveStatus === "saving" ? "toolbar.saving" : "toolbar.saved")}
    </span>
  );
}
