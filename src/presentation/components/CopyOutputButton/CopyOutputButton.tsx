import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useEditorStore } from "../../state/app-store/appStore";

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

  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => void copyToClipboard()}
    >
      {copied ? t("copyOutput.copied") : t("copyOutput.idle")}
    </button>
  );
}
