import { useState } from "react";
import { useEditorStore } from "../../state/app-store/appStore";

/**
 * The product's endgame: copies the raw ASCII export (exactly what feeds the
 * LLM — no markdown, no decoration) to the clipboard.
 */
export function CopyOutputButton() {
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
      {copied ? "COPIED!" : "COPY OUTPUT"}
    </button>
  );
}
