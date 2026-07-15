/**
 * Joins class name fragments, dropping falsy ones so callers can write
 * `cx("btn", active && "btn-active", className)` without stray spaces.
 *
 * @example cx("btn", false, "btn-sm") // "btn btn-sm"
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(" ");
}
