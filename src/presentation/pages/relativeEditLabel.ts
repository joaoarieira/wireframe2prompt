/**
 * i18n key + interpolation count describing how long ago a document was edited.
 * Pure and clock-free (the caller passes `nowMs`), so the unit selection is
 * fully testable; the component turns this into text via `t(key, { count })`.
 */
export interface RelativeEditLabel {
  /** Full i18n key under the `documentList` area. */
  key: string;
  /** Value interpolated as `{{count}}`; unused by the "just now" key. */
  count: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Picks the singular vs plural key by count, keeping the count for interpolation. */
function unit(
  singular: string,
  plural: string,
  count: number,
): RelativeEditLabel {
  return { key: count === 1 ? singular : plural, count };
}

/**
 * Chooses the coarsest unit that still reads naturally: seconds under a minute,
 * then minutes/hours (compact), then days/months/years (spelled out, so they
 * carry singular/plural keys). Future or sub-5s times collapse to "just now".
 *
 * @example relativeEditLabel(now - 5 * 60_000, now) // { key: "…editedMinutesAgo", count: 5 }
 */
export function relativeEditLabel(
  lastEditMs: number,
  nowMs: number,
): RelativeEditLabel {
  const elapsed = nowMs - lastEditMs;
  if (elapsed < 5 * SECOND) {
    return { key: "documentList.editedJustNow", count: 0 };
  }
  if (elapsed < MINUTE) {
    return {
      key: "documentList.editedSecondsAgo",
      count: Math.floor(elapsed / SECOND),
    };
  }
  if (elapsed < HOUR) {
    return {
      key: "documentList.editedMinutesAgo",
      count: Math.floor(elapsed / MINUTE),
    };
  }
  if (elapsed < DAY) {
    return {
      key: "documentList.editedHoursAgo",
      count: Math.floor(elapsed / HOUR),
    };
  }
  if (elapsed < MONTH) {
    const days = Math.floor(elapsed / DAY);
    return unit(
      "documentList.editedDayAgo",
      "documentList.editedDaysAgo",
      days,
    );
  }
  if (elapsed < YEAR) {
    const months = Math.floor(elapsed / MONTH);
    return unit(
      "documentList.editedMonthAgo",
      "documentList.editedMonthsAgo",
      months,
    );
  }
  const years = Math.floor(elapsed / YEAR);
  return unit(
    "documentList.editedYearAgo",
    "documentList.editedYearsAgo",
    years,
  );
}
