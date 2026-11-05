/**
 * Session source (IAM v0.9.7, D-51).
 *
 * Always the real API (A38): without a New CP session token (in memory)
 * the user is signed out; with one, the context comes from
 * `GET /api/v1/auth/me` (Q-B20), mapped once by `sessionContextFromMe`.
 *
 * Access events: the service adapter reports every 401 and 403 here, so the
 * session provider can return to sign-in or refresh the context (tenant
 * spec D1.5) without each page wiring it.
 */

import {
  ApiError,
  fetchAuthMe,
  readApiConfig,
  sessionContextFromMe,
  sessionToken,
  type ApiConfig,
  type ApiErrorKind,
  type SessionContext,
} from '@/shared/api';

/** Resolves the current context; rejects 401 when signed out. */
export async function loadSessionContext(config: ApiConfig = readApiConfig()): Promise<SessionContext> {
  const token = sessionToken();
  if (token === null) {
    throw new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Sign in to continue.' });
  }
  return sessionContextFromMe(await fetchAuthMe(config.baseUrl, token));
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
