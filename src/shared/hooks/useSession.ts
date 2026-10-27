/**
 * Session state shared by the app shell and pages (provided by
 * `app/SessionProvider`). Capabilities in the context are display-only.
 */

import { createContext, useContext } from 'react';
import type { ApiError, LoginResult, SessionContext } from '@/shared/api';
import type { MockIdentity } from '@/mocks/sessionFixtures';

export type SessionState =
  | { status: 'loading' }
  /** `expired`: a 401 ended the session (sign-in page says so). */
  | { status: 'signedOut'; reason?: 'expired' }
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
