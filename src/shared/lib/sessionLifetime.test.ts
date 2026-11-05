import { describe, expect, it } from 'vitest';
import { IDLE_LIMIT_MS, IDLE_WARNING_MS, MAX_LIFETIME_MS, idleWarningDue, sessionEnd } from './sessionLifetime';

const START = Date.parse('2026-10-28T08:00:00Z');
const MINUTE = 60_000;

describe('session lifetime (A36, Q-B29)', () => {
  it('ends after 30 minutes without activity, with a warning in the last 2 minutes', () => {
    const clock = { signedInAt: START, lastActivityAt: START, expiresAt: null };
    expect(sessionEnd(clock, START + IDLE_LIMIT_MS - 1)).toBeNull();
    expect(idleWarningDue(clock, START + IDLE_LIMIT_MS - IDLE_WARNING_MS - 1)).toBe(false);
    expect(idleWarningDue(clock, START + IDLE_LIMIT_MS - IDLE_WARNING_MS)).toBe(true);
    expect(sessionEnd(clock, START + IDLE_LIMIT_MS)).toBe('idle');
    expect(idleWarningDue(clock, START + IDLE_LIMIT_MS)).toBe(false);
  });

  it('ends 8 hours after sign-in even while active', () => {
    const now = START + MAX_LIFETIME_MS;
    expect(sessionEnd({ signedInAt: START, lastActivityAt: now - MINUTE, expiresAt: null }, now)).toBe('max');
  });

  it('ends at the server expiry first when it comes earlier', () => {
    const expiresAt = START + 10 * MINUTE;
    expect(sessionEnd({ signedInAt: START, lastActivityAt: expiresAt, expiresAt }, expiresAt)).toBe('expired');
    expect(sessionEnd({ signedInAt: START, lastActivityAt: START, expiresAt }, expiresAt - 1)).toBeNull();
  });
});
