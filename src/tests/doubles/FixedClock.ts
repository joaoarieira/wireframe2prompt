import type { IClock } from "../../domain/ports/IClock";

/** Deterministic {@link IClock} for tests: `now()` returns a settable value. */
export class FixedClock implements IClock {
  private value: number;

  constructor(value = 0) {
    this.value = value;
  }

  now(): number {
    return this.value;
  }

  /** Moves the fixed time so a test can simulate the clock advancing. */
  set(value: number): void {
    this.value = value;
  }
}
