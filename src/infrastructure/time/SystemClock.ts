import type { IClock } from "../../domain/ports/IClock";

/** {@link IClock} backed by the platform wall clock (`Date.now`). */
export class SystemClock implements IClock {
  now(): number {
    return Date.now();
  }
}
