import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "../ui/button/Button";
import { ButtonLink } from "../ui/button-link/ButtonLink";
import { ExternalTextLink } from "../ui/text-link/TextLink";
import { AboutExample } from "../components/AboutExample/AboutExample";
import { AboutCardGrid } from "../components/AboutCardGrid/AboutCardGrid";
import { GithubIcon } from "../components/icons/GithubIcon";
import { GITHUB_URL } from "../githubUrl";

/**
 * The product's About page at /about: how to use it, where to use it, the
 * fast-prototyping philosophy, copyable ASCII examples, how to contribute, and
 * a single "Start now" CTA back to the wireframe list.
 */
export function AboutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const steps = [
    t("about.howToUseStep1"),
    t("about.howToUseStep2"),
    t("about.howToUseStep3"),
  ];
  const uses = [
    t("about.whereToUse1"),
    t("about.whereToUse2"),
    t("about.whereToUse3"),
  ];
  const philosophy = [
    t("about.philosophyBody1"),
    t("about.philosophyBody2"),
    t("about.philosophyBody3"),
  ];

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
            <h2 className="text-xl font-semibold">
              {t("about.howToUseTitle")}
            </h2>
            <p className="leading-relaxed opacity-80">
              {t("about.howToUseIntro")}
            </p>
            <AboutCardGrid numbered items={steps} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {t("about.whereToUseTitle")}
            </h2>
            <AboutCardGrid items={uses} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {t("about.philosophyTitle")}
            </h2>
            <AboutCardGrid items={philosophy} />
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold">
              {t("about.examplesTitle")}
            </h2>
            <AboutExample
              title={t("about.exampleGoogleTitle")}
              ascii={t("about.exampleGoogleAscii")}
            />
            <AboutExample
              title={t("about.exampleSpotifyTitle")}
              ascii={t("about.exampleSpotifyAscii")}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {t("about.contributeTitle")}
            </h2>
            <p className="leading-relaxed opacity-80">
              {t("about.contributeBody")}
            </p>
            <p className="leading-relaxed">
              <ExternalTextLink
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <GithubIcon className="size-4" aria-hidden />
                {t("about.contributeLink")}
              </ExternalTextLink>
            </p>
          </section>

          <div className="flex">
            <ButtonLink to="/" variant="primary">
              {t("about.startNow")}
            </ButtonLink>
          </div>
        </article>
      </main>
    </div>
  );
}
