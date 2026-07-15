import { describe, expect, test } from "vitest";
import { cx } from "./classNames";

describe("cx", () => {
  test("joins truthy fragments with single spaces", () => {
    expect(cx("btn", "btn-sm")).toBe("btn btn-sm");
  });

  test("drops every falsy fragment", () => {
    expect(cx("btn", false, null, undefined, "", "btn-primary")).toBe(
      "btn btn-primary",
    );
  });

  test("returns an empty string when nothing is truthy", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
