import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  upsertMetaDescription,
  usePageMetadata,
  useNoIndex,
} from "./usePageMetadata";

function metaContent(selector: string): string | null {
  return (
    document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null
  );
}

function Metadata() {
  usePageMetadata({
    titleKey: "seo.homeTitle",
    descriptionKey: "seo.homeDescription",
  });
  return null;
}

function NoIndex() {
  useNoIndex();
  return null;
}

afterEach(() => {
  cleanup();
  document.head
    .querySelectorAll('meta[name="description"], meta[name="robots"]')
    .forEach((meta) => meta.remove());
});

describe("upsertMetaDescription", () => {
  test("creates the description meta when none exists", () => {
    upsertMetaDescription("first");

    const metas = document.head.querySelectorAll('meta[name="description"]');
    expect(metas).toHaveLength(1);
    expect(metaContent('meta[name="description"]')).toBe("first");
  });

  test("updates the existing tag instead of adding a second one", () => {
    upsertMetaDescription("first");
    upsertMetaDescription("second");

    expect(
      document.head.querySelectorAll('meta[name="description"]'),
    ).toHaveLength(1);
    expect(metaContent('meta[name="description"]')).toBe("second");
  });
});

describe("usePageMetadata", () => {
  test("sets the tab title with the untranslated product name appended", () => {
    render(<Metadata />);
    expect(document.title).toBe(
      "Draw ASCII wireframes for AI prompts — wireframe2prompt",
    );
  });

  test("sets the meta description from the translation key", () => {
    render(<Metadata />);
    expect(metaContent('meta[name="description"]')).toBe(
      "Free online ASCII wireframe editor. Drag buttons, inputs and cards onto a text grid, then copy the result as a prompt so an AI can build your interface — no design skills needed.",
    );
  });
});

describe("useNoIndex", () => {
  test("adds a noindex robots tag while mounted and removes it on unmount", () => {
    const view = render(<NoIndex />);
    expect(metaContent('meta[name="robots"]')).toBe("noindex");

    view.unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
