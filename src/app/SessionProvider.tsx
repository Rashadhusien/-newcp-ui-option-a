/**
 * Loads the session context on app start and keeps it current:
 * - a 401 from any API call returns the app to "signed out" (sign-in page);
 * - a 403 refreshes the context, so revoked roles show up (tenant spec D1.5).
 * The context is held in memory only.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isApiError } from '@/shared/api';
import { SessionContextValue, type SessionState, type SessionValue } from '@/shared/hooks/useSession';
import {
  chooseMockIdentity,
  clearMockIdentity,
  loadSessionContext,
  onAccessEvent,
} from '@/shared/lib/session';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    loadSessionContext().then(
      (context) => {
        if (active) setState({ status: 'ready', context });
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
          clearMockIdentity();
          setState({ status: 'signedOut' });
        } else {
          refresh();
        }
      }),
    [refresh],
  );

  const value = useMemo<SessionValue>(
    () => ({
      state,
      context: state.status === 'ready' ? state.context : null,
      refresh,
      signIn: (identity) => {
        chooseMockIdentity(identity);
        setState({ status: 'loading' });
        refresh();
      },
      signOut: () => {
        clearMockIdentity();
        setState({ status: 'signedOut' });
      },
    }),
    [state, refresh],
  );

  return <SessionContextValue.Provider value={value}>{children}</SessionContextValue.Provider>;
}
