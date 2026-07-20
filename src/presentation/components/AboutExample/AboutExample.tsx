import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button/Button";

interface AboutExampleProps {
  /** Already-translated section heading. */
  title: string;
  /** Raw ASCII block to render and copy verbatim (never translated content). */
  ascii: string;
}

/**
 * A titled ASCII example on the About page with a "Copy" button. Mirrors the
 * copy-and-revert pattern of {@link CopyOutputButton} but takes the text as a
 * prop instead of reading the editor store, so it stays trivial to test.
 */
export function AboutExample({ title, ascii }: AboutExampleProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(ascii);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void copyToClipboard()}
        >
          {copied ? t("about.copied") : t("about.copyExample")}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded border border-base-300 bg-base-200 p-4 font-mono text-xs leading-none flex justify-center">
        {ascii}
      </pre>
    </section>
  );
}
