import { describe, expect, test } from "vitest";
import { SITE_URL } from "./siteUrl";

describe("SITE_URL", () => {
  test("is an https origin without a trailing slash", () => {
    expect(SITE_URL.startsWith("https://")).toBe(true);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
