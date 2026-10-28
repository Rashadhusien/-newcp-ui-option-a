/**
 * Session lifetime (A36, Q-B29 approved by Hesham 28 Oct, IAM spec): a
 * session ends after 30 minutes without activity, 8 hours after sign-in,
 * or at the server's `expiresAt`, whichever comes first. A warning shows
 * 2 minutes before the idle limit. Pure: times in, decision out; the
 * session provider supplies the clock and the activity.
 */

export const IDLE_LIMIT_MS = 30 * 60_000;
export const MAX_LIFETIME_MS = 8 * 60 * 60_000;
export const IDLE_WARNING_MS = 2 * 60_000;

export interface SessionClock {
  /** When this sign-in started (ms since epoch). */
  signedInAt: number;
  /** Last user activity (ms since epoch). */
  lastActivityAt: number;
  /** Server expiry of the token (ms since epoch); null when not given (mock). */
  expiresAt: number | null;
}

/** Why a session ended on its own: `expired` = server expiry, `max` = 8 h, `idle` = 30 min. */
export type SessionEnd = 'expired' | 'max' | 'idle';

export function sessionEnd(clock: SessionClock, now: number): SessionEnd | null {
  if (clock.expiresAt !== null && now >= clock.expiresAt) return 'expired';
  if (now - clock.signedInAt >= MAX_LIFETIME_MS) return 'max';
  if (now - clock.lastActivityAt >= IDLE_LIMIT_MS) return 'idle';
  return null;
}

/** Milliseconds left before the idle sign-out (never negative). */
export function idleRemainingMs(clock: SessionClock, now: number): number {
  return Math.max(0, clock.lastActivityAt + IDLE_LIMIT_MS - now);
}

/** True while the idle warning should show: the idle limit is less than 2 minutes away. */
export function idleWarningDue(clock: SessionClock, now: number): boolean {
  return sessionEnd(clock, now) === null && idleRemainingMs(clock, now) <= IDLE_WARNING_MS;
}
