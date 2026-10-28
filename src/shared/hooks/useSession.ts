/**
 * Session state shared by the app shell and pages (provided by
 * `app/SessionProvider`). Capabilities in the context are display-only.
 */

import { createContext, useContext } from 'react';
import type { ApiError, LoginResult, SessionContext } from '@/shared/api';
import type { MockIdentity } from '@/mocks/sessionFixtures';

/**
 * Why the session ended without the user signing out: `expired` = a 401 or
 * the server's expiry, `idle` = 30 minutes without activity, `max` = 8 hours
 * after sign-in (A36). The sign-in page says which.
 */
export type SignedOutReason = 'expired' | 'idle' | 'max';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut'; reason?: SignedOutReason }
  | { status: 'blocked'; message: string }
  | { status: 'error'; error: ApiError | null }
  | { status: 'ready'; context: SessionContext };

export interface SessionValue {
  state: SessionState;
  /** The context when ready, else null. */
  context: SessionContext | null;
  refresh: () => void;
  /** Mock mode only. */
  signIn: (identity: MockIdentity) => void;
  /** Real API: keeps the New CP session token (memory only) and loads access. */
  signInWithSession: (result: LoginResult) => void;
  signOut: () => void;
}

export const SessionContextValue = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const value = useContext(SessionContextValue);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
