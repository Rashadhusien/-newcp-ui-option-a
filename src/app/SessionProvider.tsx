/**
 * Loads the session context on app start and keeps it current:
 * - a 401 from any API call returns the app to "signed out" (sign-in page,
 *   which says the session expired) and drops the session token, once even
 *   when several calls fail together;
 * - a 403 refreshes the context, so revoked roles show up (tenant spec D1.5)
 *   and never signs out;
 * - session lifetime (A36, Q-B29): signed out at the server's `expiresAt`,
 *   8 hours after sign-in, or after 30 minutes without activity. A banner
 *   with a countdown shows 2 minutes before. Checked every second against
 *   Date.now() and again when the window gains focus or the tab becomes
 *   visible, so it stays correct after sleep or tab throttling;
 * - sign-out in one tab signs out the others (BroadcastChannel, event name
 *   only, never the token).
 * The token is mirrored in sessionStorage so a reload keeps the tab signed in. Signing out with the
 * real API calls `POST /auth/logout` first (whatever the answer, the token
 * is dropped) and stops Google's automatic re-sign-in for this browser, so
 * only a reload, not a sign-out, signs back in silently.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearSessionToken, isApiError, logoutSession, readApiConfig, sessionTimes, sessionToken, setSessionToken } from '@/shared/api';
import { SessionContextValue, type SessionState, type SessionValue, type SignedOutReason } from '@/shared/hooks/useSession';
import { loadSessionContext, onAccessEvent } from '@/shared/lib/session';
import {
  IDLE_WARNING_MS,
  MAX_LIFETIME_MS,
  idleRemainingMs,
  sessionEnd,
  type SessionClock,
} from '@/shared/lib/sessionLifetime';
import { readAfterSignIn, saveReturnTo } from '@/shared/lib/returnTo';
import { disableGoogleAutoSelect } from '@/features/auth/googleIdentity';
import { SessionExpiryNotice } from './SessionExpiryNotice';

const CHECK_EVERY_MS = 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const CHANNEL_NAME = 'newcp-auth';
const SIGNED_OUT_EVENT = 'signed-out';

interface ExpiryWarning {
  remainingMs: number;
  /** true when inactivity is what ends the session, so activity can extend it. */
  canStay: boolean;
}

/** `POST /auth/logout` with the current token; best effort, never throws. */
async function logoutOnServer(): Promise<void> {
  const config = readApiConfig();
  const token = sessionToken();
  if (token === null) return;
  try {
    await logoutSession(config.baseUrl, token);
  } catch {
    // The server may already have ended the session; locally it ends now either way.
  }
}

/** Drops everything this tab holds for the session. */
function clearLocalSession(): void {
  disableGoogleAutoSelect();
  clearSessionToken();
}

/** The earliest end the user cannot postpone (server expiry or the 8-hour limit), then inactivity. */
function warningFor(clock: SessionClock, now: number): ExpiryWarning | null {
  const fixedLeft = Math.min(
    clock.expiresAt === null ? Infinity : clock.expiresAt - now,
    clock.signedInAt + MAX_LIFETIME_MS - now,
  );
  if (fixedLeft <= IDLE_WARNING_MS) return { remainingMs: fixedLeft, canStay: false };
  const idleLeft = idleRemainingMs(clock, now);
  return idleLeft <= IDLE_WARNING_MS ? { remainingMs: idleLeft, canStay: true } : null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const clock = useRef<SessionClock | null>(null);
  const [warning, setWarning] = useState<ExpiryWarning | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  // Set once the session has ended, so a burst of parallel 401s ends it once.
  const ended = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  // Who is signed in (from /auth/me), so the page they were on can be offered back to the same person only.
  const userId = useRef<string | null>(null);

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const endSession = useCallback((reason?: SignedOutReason) => {
    ended.current = true;
    if (userId.current !== null && readAfterSignIn() === 'last') {
      saveReturnTo(`${window.location.pathname}${window.location.search}`, userId.current);
    }
    userId.current = null;
    clearLocalSession();
    clock.current = null;
    setWarning(null);
    setState(reason ? { status: 'signedOut', reason } : { status: 'signedOut' });
  }, []);

  const signOut = useCallback(() => {
    if (signingOut) return;
    setSigningOut(true);
    void logoutOnServer().finally(() => {
      endSession();
      channel.current?.postMessage(SIGNED_OUT_EVENT);
      setSigningOut(false);
    });
  }, [signingOut, endSession]);

  useEffect(() => {
    let active = true;
    loadSessionContext().then(
      (context) => {
        if (!active) return;
        // A reload or a fresh sign-in starts the clock; a 403 refresh keeps it.
        const now = Date.now();
        const stored = sessionTimes();
        clock.current ??= { signedInAt: stored?.signedInAt ?? now, lastActivityAt: now, expiresAt: stored?.expiresAt ?? null };
        userId.current = context.user.id;
        setState({ status: 'ready', context });
      },
      (error: unknown) => {
        if (!active) return;
        if (isApiError(error) && error.kind === 'unauthorized') setState({ status: 'signedOut' });
        else if (isApiError(error) && error.kind === 'blocked') setState({ status: 'blocked', message: error.message });
        else setState({ status: 'error', error: isApiError(error) ? error : null });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(
    () =>
      onAccessEvent((event) => {
        if (event === 'unauthorized') {
          if (!ended.current) endSession('expired');
        } else refresh();
      }),
    [endSession, refresh],
  );

  // Another tab signed out: end this one too (the other tab already called the server).
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const opened = new BroadcastChannel(CHANNEL_NAME);
    channel.current = opened;
    opened.onmessage = (message: MessageEvent<unknown>) => {
      if (message.data === SIGNED_OUT_EVENT && clock.current !== null) endSession();
    };
    return () => {
      opened.close();
      channel.current = null;
    };
  }, [endSession]);

  // Lifetime checks while signed in.
  const signedIn = state.status === 'ready';
  useEffect(() => {
    if (!signedIn) return;
    let lastMark = 0;
    const markActivity = () => {
      const now = Date.now();
      // Throttled: one update per second is enough for a 30-minute limit.
      if (now - lastMark < 1000 || !clock.current) return;
      lastMark = now;
      clock.current.lastActivityAt = now;
    };
    const check = () => {
      const current = clock.current;
      if (!current) return;
      const now = Date.now();
      const end = sessionEnd(current, now);
      if (end) endSession(end);
      else setWarning(warningFor(current, now));
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, markActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => {
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, markActivity);
      });
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.clearInterval(timer);
    };
  }, [signedIn, endSession]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      context: state.status === 'ready' ? state.context : null,
      refresh,
      signInWithSession: (result) => {
        ended.current = false;
        setSessionToken(result);
        const now = Date.now();
        const expiresAt = result.expiresAt === null ? null : Date.parse(result.expiresAt);
        clock.current = { signedInAt: now, lastActivityAt: now, expiresAt };
        setState({ status: 'loading' });
        refresh();
      },
      signOut,
      signingOut,
    }),
    [state, refresh, signOut, signingOut],
  );

  return (
    <SessionContextValue.Provider value={value}>
      {children}
      <SessionExpiryNotice
        open={signedIn && warning !== null}
        remainingMs={warning?.remainingMs ?? 0}
        canStay={warning?.canStay ?? false}
        signingOut={signingOut}
        onStay={() => {
          if (clock.current) clock.current.lastActivityAt = Date.now();
          setWarning(null);
        }}
        onSignInAgain={signOut}
      />
    </SessionContextValue.Provider>
  );
}
