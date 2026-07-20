import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "../ui/button/Button";

/**
 * Static project description page at /about.
 * Content is intentionally brief for now; layout is ready for rich text.
 */
export function AboutPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-base-100">
      <header className="flex items-center gap-3 border-b border-base-300 bg-base-200 px-4 py-2">
        {/* Back to wherever About was opened from — the editor (reopening the
            document via its loader) or the document list — via history, not a
            fixed `to`. */}
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("about.back")}
          title={t("about.back")}
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <span className="text-sm font-bold">wireframe2prompt</span>
      </header>
      <main className="flex-1 overflow-auto px-6 py-12">
        <article className="mx-auto max-w-2xl space-y-12">
          <header className="space-y-3">
            <h1 className="text-3xl font-bold">{t("about.title")}</h1>
            <p className="text-base leading-relaxed opacity-80">
              {t("about.summary")}
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t("about.whatIsTitle")}</h2>
            <p className="leading-relaxed opacity-80">
              {t("about.whatIsBody")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {t("about.howToUseTitle")}
            </h2>
            <p className="leading-relaxed opacity-80">
              {t("about.howToUseBody")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {t("about.techStackTitle")}
            </h2>
            <p className="leading-relaxed opacity-80">
              {t("about.techStackBody")}
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
