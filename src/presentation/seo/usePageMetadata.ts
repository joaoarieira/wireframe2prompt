import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface PageMetadata {
  titleKey: string;
  descriptionKey: string;
}

/**
 * Ensures exactly one `<meta name="description">` in `<head>`: creates it on
 * the first call, updates its content thereafter — it never duplicates. Kept
 * as a pure DOM helper so both branches (create / update) are testable alone.
 */
export function upsertMetaDescription(content: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/**
 * Sets the tab title and meta description for a route from i18n keys, re-running
 * when the active language changes so both follow the switcher. The product name
 * is appended untranslated (it is not localized).
 *
 * @example usePageMetadata({ titleKey: "seo.homeTitle", descriptionKey: "seo.homeDescription" });
 */
export function usePageMetadata({
  titleKey,
  descriptionKey,
}: PageMetadata): void {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${t(titleKey)} — wireframe2prompt`;
    upsertMetaDescription(t(descriptionKey));
  }, [t, titleKey, descriptionKey]);
}

/**
 * Marks the current route non-indexable via `<meta name="robots" content="noindex">`
 * while mounted, removing the tag on unmount so navigating to an indexable route
 * (home, about) drops the directive. Used by the editor — it only ever shows the
 * user's private local documents.
 */
export function useNoIndex(): void {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
