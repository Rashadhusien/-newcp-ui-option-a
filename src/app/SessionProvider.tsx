/**
 * Loads the session context on app start and keeps it current:
 * - a 401 from any API call returns the app to "signed out" (sign-in page,
 *   which says the session ended) and drops the session token;
 * - a 403 refreshes the context, so revoked roles show up (tenant spec D1.5);
 * - session lifetime (A36, Q-B29): signed out after 30 minutes without
 *   activity (warning 2 minutes before), 8 hours after sign-in, or at the
 *   server's `expiresAt`. Checked every 15 seconds and when the tab becomes
 *   visible again; activity is a pointer, key, wheel or touch event.
 * The context and the token are held in memory only. Signing out with the
 * real API also calls `POST /auth/logout` (best effort; the token is dropped
 * either way) and stops Google's automatic re-sign-in for this browser, so
 * only a reload, not a sign-out, signs back in silently.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearSessionToken, isApiError, logoutSession, readApiConfig, sessionToken, setSessionToken } from '@/shared/api';
import { SessionContextValue, type SessionState, type SessionValue, type SignedOutReason } from '@/shared/hooks/useSession';
import {
  chooseMockIdentity,
  clearMockIdentity,
  loadSessionContext,
  onAccessEvent,
} from '@/shared/lib/session';
import { idleRemainingMs, idleWarningDue, sessionEnd, type SessionClock } from '@/shared/lib/sessionLifetime';
import { disableGoogleAutoSelect } from '@/features/auth/googleIdentity';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';

const CHECK_EVERY_MS = 15_000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/** Ends the session on this side: server logout (real API), token and mock identity dropped. */
function endLocalSession(): void {
  const config = readApiConfig();
  const token = sessionToken();
  if (!config.useMocks && token !== null) {
    logoutSession(config.baseUrl, token).catch(() => {
      // The server may already have ended the session; locally it ends now either way.
    });
  }
  disableGoogleAutoSelect();
  clearMockIdentity();
  clearSessionToken();
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const clock = useRef<SessionClock | null>(null);
  const [warning, setWarning] = useState<number | null>(null);

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const endSession = useCallback((reason?: SignedOutReason) => {
    endLocalSession();
    clock.current = null;
    setWarning(null);
    setState(reason ? { status: 'signedOut', reason } : { status: 'signedOut' });
  }, []);

  useEffect(() => {
    let active = true;
    loadSessionContext().then(
      (context) => {
        if (!active) return;
        // A reload or a fresh sign-in starts the clock; a 403 refresh keeps it.
        const now = Date.now();
        clock.current ??= { signedInAt: now, lastActivityAt: now, expiresAt: null };
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
        if (event === 'unauthorized') endSession('expired');
        else refresh();
      }),
    [endSession, refresh],
  );

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
      setWarning(null);
    };
    const check = () => {
      const current = clock.current;
      if (!current) return;
      const now = Date.now();
      const end = sessionEnd(current, now);
      if (end) endSession(end);
      else setWarning(idleWarningDue(current, now) ? idleRemainingMs(current, now) : null);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, markActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => {
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, markActivity);
      });
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [signedIn, endSession]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      context: state.status === 'ready' ? state.context : null,
      refresh,
      signIn: (identity) => {
        chooseMockIdentity(identity);
        clock.current = null;
        setState({ status: 'loading' });
        refresh();
      },
      signInWithSession: (result) => {
        setSessionToken(result);
        const now = Date.now();
        const expiresAt = result.expiresAt === null ? null : Date.parse(result.expiresAt);
        clock.current = { signedInAt: now, lastActivityAt: now, expiresAt };
        setState({ status: 'loading' });
        refresh();
      },
      signOut: () => {
        endSession();
      },
    }),
    [state, refresh, endSession],
  );

  return (
    <SessionContextValue.Provider value={value}>
      {children}
      <SessionTimeoutDialog
        open={signedIn && warning !== null}
        remainingMs={warning ?? 0}
        onStay={() => {
          if (clock.current) clock.current.lastActivityAt = Date.now();
          setWarning(null);
        }}
        onSignOut={() => {
          endSession();
        }}
      />
    </SessionContextValue.Provider>
  );
}
