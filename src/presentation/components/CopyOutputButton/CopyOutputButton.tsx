import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { useEditorStore } from "../../state/app-store/appStore";
import { Button } from "../../ui/button/Button";

/**
 * The product's endgame: copies the raw ASCII export (exactly what feeds the
 * LLM — no markdown, no decoration) to the clipboard.
 */
export function CopyOutputButton() {
  const { t } = useTranslation();
  const document = useEditorStore((state) => state.document);
  const exportAscii = useEditorStore((state) => state.exportAscii);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (document === null) {
      return;
    }
    await navigator.clipboard.writeText(exportAscii());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const label = copied ? t("copyOutput.copied") : t("copyOutput.idle");
  return (
    // On phones the label is dropped to save room in the scrolling footer; the
    // aria-label keeps the accessible name (the visible text is display:none,
    // which drops it from the a11y tree, so it can't carry the name there).
    <Button
      variant="primary"
      aria-label={label}
      title={label}
      className="shrink-0"
      onClick={() => void copyToClipboard()}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
