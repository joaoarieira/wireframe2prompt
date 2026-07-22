/**
 * Time source port. Keeps the domain/application pure: use cases that need the
 * current time depend on this instead of calling `Date.now()` directly, so tests
 * inject a fixed clock. Implemented by {@link SystemClock} in Infrastructure.
 */
export interface IClock {
  /** Current time as epoch milliseconds. */
  now(): number;
}
