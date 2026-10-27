/**
 * Session source (IAM v0.9.7, D-51).
 *
 * The session context endpoint is not in the reference OpenAPI (Q-B20) and
 * the auth transport is open (Q-B21), so:
 * - mock mode: the context is a mock fixture for the identity chosen on the
 *   sign-in page. The choice lives in sessionStorage (this tab only); it is
 *   not a token, and nothing else about the session is stored.
 * - real API: without a New CP session token (A25, in memory) the user is
 *   signed out; with one, the context is still BLOCKED because its endpoint
 *   is not in the contract (Q-B20), so no request is sent.
 *
 * Storage access is guarded: private windows or blocked site data can throw,
 * which must read as "signed out" rather than crash the app.
 *
 * Access events: the service adapter reports every 401 and 403 here, so the
 * session provider can return to sign-in or refresh the context (tenant
 * spec D1.5) without each page wiring it.
 */

import {
  ApiError,
  readApiConfig,
  sessionToken,
  type ApiConfig,
  type ApiErrorKind,
  type SessionContext,
} from '@/shared/api';
import { isMockIdentity, mockSessionContext, type MockIdentity } from '@/mocks/sessionFixtures';

const IDENTITY_KEY = 'newcp-mock-identity';

export function mockIdentity(): MockIdentity | null {
  try {
    const value = sessionStorage.getItem(IDENTITY_KEY);
    return isMockIdentity(value) ? value : null;
  } catch {
    return null;
  }
}

export function chooseMockIdentity(identity: MockIdentity): void {
  try {
    sessionStorage.setItem(IDENTITY_KEY, identity);
  } catch {
    // Without storage the choice cannot survive; the sign-in page says so by staying put.
  }
}

export function clearMockIdentity(): void {
  try {
    sessionStorage.removeItem(IDENTITY_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}

export const SESSION_BLOCKED_MESSAGE =
  'You are signed in, but your access cannot be loaded yet: the session context endpoint is not in the API contract (Q-B20).';

/** Resolves the current context; rejects 401 when signed out and `blocked` with the real API. */
export function loadSessionContext(config: ApiConfig = readApiConfig()): Promise<SessionContext> {
  if (!config.useMocks) {
    if (sessionToken() === null) {
      return Promise.reject(new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Sign in to continue.' }));
    }
    return Promise.reject(new ApiError(0, { code: 'client.blocked', message: SESSION_BLOCKED_MESSAGE }, 'blocked'));
  }
  const identity = mockIdentity();
  if (identity === null) {
    return Promise.reject(
      new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Sign in to continue.' }),
    );
  }
  return Promise.resolve(mockSessionContext(identity));
}

export type AccessEvent = Extract<ApiErrorKind, 'unauthorized' | 'forbidden' | 'accessNotAssigned'>;

const listeners = new Set<(event: AccessEvent) => void>();

export function onAccessEvent(listener: (event: AccessEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the data adapter for every rejected call. */
export function reportAccessError(error: unknown): void {
  if (!(error instanceof ApiError)) return;
  const { kind } = error;
  if (kind === 'unauthorized' || kind === 'forbidden' || kind === 'accessNotAssigned') {
    listeners.forEach((listener) => {
      listener(kind);
    });
  }
}

/**
 * Only in-app paths survive as a return destination; never an external or
 * protocol-relative URL (tenant spec D3: "preserve safe destination only").
 */
export function safeReturnPath(requested: string | null | undefined, fallback: string): string {
  if (!requested?.startsWith('/') || requested.startsWith('//') || requested.startsWith('/\\')) return fallback;
  return requested;
}
