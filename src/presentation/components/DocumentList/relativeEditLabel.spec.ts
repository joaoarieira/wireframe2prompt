import { describe, expect, test } from "vitest";
import { relativeEditLabel } from "./relativeEditLabel";

const NOW = 1_700_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Builds a `nowMs` that is `elapsed` after the last edit at NOW. */
const ago = (elapsed: number) => relativeEditLabel(NOW, NOW + elapsed);

describe("relativeEditLabel", () => {
  test("collapses sub-5s and future times to 'just now'", () => {
    expect(ago(0)).toEqual({ key: "documentList.editedJustNow", count: 0 });
    expect(ago(4 * SECOND)).toEqual({
      key: "documentList.editedJustNow",
      count: 0,
    });
    expect(ago(-1000)).toEqual({ key: "documentList.editedJustNow", count: 0 });
  });

  test("reports whole seconds under a minute", () => {
    expect(ago(15 * SECOND)).toEqual({
      key: "documentList.editedSecondsAgo",
      count: 15,
    });
  });

  test("reports minutes under an hour", () => {
    expect(ago(5 * MINUTE)).toEqual({
      key: "documentList.editedMinutesAgo",
      count: 5,
    });
  });

  test("reports hours under a day", () => {
    expect(ago(2 * HOUR)).toEqual({
      key: "documentList.editedHoursAgo",
      count: 2,
    });
  });

  test("switches to singular vs plural days", () => {
    expect(ago(DAY)).toEqual({ key: "documentList.editedDayAgo", count: 1 });
    expect(ago(2 * DAY)).toEqual({
      key: "documentList.editedDaysAgo",
      count: 2,
    });
  });

  test("switches to singular vs plural months", () => {
    expect(ago(MONTH)).toEqual({
      key: "documentList.editedMonthAgo",
      count: 1,
    });
    expect(ago(5 * MONTH)).toEqual({
      key: "documentList.editedMonthsAgo",
      count: 5,
    });
  });

  test("switches to singular vs plural years", () => {
    expect(ago(YEAR)).toEqual({ key: "documentList.editedYearAgo", count: 1 });
    expect(ago(2 * YEAR)).toEqual({
      key: "documentList.editedYearsAgo",
      count: 2,
    });
  });
});
