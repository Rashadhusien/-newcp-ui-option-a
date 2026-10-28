/**
 * New CP sign-in and session endpoints (canonical contract, Q-B27/Q-B20,
 * D-79; A30). The Google ID token from Google Identity Services goes to
 * `POST /api/v1/auth/login` once. The backend answers either AUTHORIZED
 * with the New CP `token` and its `expiresAt`, or PENDING_ACCESS with no
 * token (the account has no tenant role yet). Every later request sends
 * `Authorization: Bearer <token>`; `GET /api/v1/auth/me` gives the session
 * context and `POST /api/v1/auth/logout` ends the session.
 *
 * The token is kept in memory only (CLAUDE.md: no token storage), so a page
 * reload signs in again until the backend says otherwise (Q-B29). The
 * Google ID token is sent to the login endpoint only and never kept.
 * Auth errors arrive as `{ error: Problem }`; `asProblem` reads both shapes.
 */

import { ApiError, asProblem } from './apiError';
import type { AuthMeResponse } from './types';

export interface LoginResult {
  sessionToken: string;
  /** ISO date-time; null when the response gave no usable expiry. */
  expiresAt: string | null;
}

/** What POST /auth/login answered. */
export type LoginOutcome = { kind: 'authorized'; session: LoginResult } | { kind: 'pendingAccess' };

/** Reads the contract's AuthorizedLoginResponse / PendingAccessLoginResponse. */
export function asLoginOutcome(body: unknown): LoginOutcome | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  if (record.accessStatus === 'PENDING_ACCESS') return { kind: 'pendingAccess' };
  if (record.accessStatus !== 'AUTHORIZED' || typeof record.token !== 'string' || record.token === '') return null;
  const expiresAt =
    typeof record.expiresAt === 'string' && !Number.isNaN(Date.parse(record.expiresAt)) ? record.expiresAt : null;
  return { kind: 'authorized', session: { sessionToken: record.token, expiresAt } };
}

const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

async function authCall(
  baseUrl: string,
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<{ response: Response; body: unknown }> {
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, init);
  } catch {
    throw ApiError.network();
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, asProblem(body));
  return { response, body };
}

export async function loginWithGoogleIdToken(
  baseUrl: string,
  idToken: string,
  fetchImpl: typeof fetch = defaultFetch,
): Promise<LoginOutcome> {
  const { body } = await authCall(
    baseUrl,
    '/api/v1/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ idToken }),
    },
    fetchImpl,
  );
  const outcome = asLoginOutcome(body);
  if (!outcome) {
    throw new ApiError(
      0,
      { code: 'client.login_response', message: 'The server answered the sign-in without a session token.' },
      'server',
    );
  }
  return outcome;
}

/** GET /auth/me with the session token: who is signed in, tenant, roles, capabilities. */
export async function fetchAuthMe(
  baseUrl: string,
  token: string,
  fetchImpl: typeof fetch = defaultFetch,
): Promise<AuthMeResponse> {
  const { body } = await authCall(
    baseUrl,
    '/api/v1/auth/me',
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    fetchImpl,
  );
  // Trusted to match the contract at this one boundary, like the service client.
  return body as AuthMeResponse;
}

/** POST /auth/logout. Best effort: the token is dropped locally whatever the answer. */
export async function logoutSession(baseUrl: string, token: string, fetchImpl: typeof fetch = defaultFetch): Promise<void> {
  await authCall(
    baseUrl,
    '/api/v1/auth/logout',
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    fetchImpl,
  );
}

// ---------------------------------------------------------------------------
// In-memory session token (never written to storage)
// ---------------------------------------------------------------------------

let current: LoginResult | null = null;

export function setSessionToken(result: LoginResult): void {
  current = result;
}

export function clearSessionToken(): void {
  current = null;
}

/** The token while it is present and unexpired; null otherwise. */
export function sessionToken(now: number = Date.now()): string | null {
  if (!current) return null;
  if (current.expiresAt !== null && Date.parse(current.expiresAt) <= now) {
    current = null;
    return null;
  }
  return current.sessionToken;
}

/** Token source for the API client: a missing or expired session is a 401 (back to sign-in). */
export function bearerTokenSource(): string {
  const token = sessionToken();
  if (token === null) {
    throw new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Your session has ended. Sign in again.' });
  }
  return token;
}
