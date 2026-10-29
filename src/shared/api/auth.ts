/**
 * New CP sign-in and session endpoints (canonical contract, Q-B27/Q-B20,
 * D-79; A30). The Google ID token from Google Identity Services goes to
 * `POST /api/v1/auth/login` once. The backend answers either AUTHORIZED
 * with the New CP `token` and its `expiresAt`, or PENDING_ACCESS with no
 * token (the account has no tenant role yet). Every later request sends
 * `Authorization: Bearer <token>`; `GET /api/v1/auth/me` gives the session
 * context and `POST /api/v1/auth/logout` ends the session.
 *
 * The token is kept in memory and mirrored in sessionStorage (see below), so a page
 * reload keeps the tab signed in until the token expires (Q-B29). The
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
// Session token: memory, backed by sessionStorage so a reload keeps the tab
// signed in (developer decision, 29 Oct; this departs from the memory-only
// rule in CLAUDE.md / D-67 and needs Aya's approval). sessionStorage is per
// tab and ends with it; every access is guarded because it can throw.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'newcp-session';

interface StoredSession extends LoginResult {
  signedInAt: number;
}

let current: StoredSession | null = null;

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.sessionToken !== 'string' || record.sessionToken === '') return null;
    return {
      sessionToken: record.sessionToken,
      expiresAt: typeof record.expiresAt === 'string' ? record.expiresAt : null,
      signedInAt: typeof record.signedInAt === 'number' ? record.signedInAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function loaded(): StoredSession | null {
  current ??= readStored();
  return current;
}

export function setSessionToken(result: LoginResult): void {
  current = { ...result, signedInAt: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Without storage the session still works until a reload.
  }
}

export function clearSessionToken(): void {
  current = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}

/** When this tab's current sign-in started and when the server ends it, for the session clock after a reload. */
export function sessionTimes(): { signedInAt: number; expiresAt: number | null } | null {
  const session = loaded();
  if (!session) return null;
  return { signedInAt: session.signedInAt, expiresAt: session.expiresAt === null ? null : Date.parse(session.expiresAt) };
}

/** The token while it is present and unexpired; null otherwise. */
export function sessionToken(now: number = Date.now()): string | null {
  const session = loaded();
  if (!session) return null;
  if (session.expiresAt !== null && Date.parse(session.expiresAt) <= now) {
    clearSessionToken();
    return null;
  }
  return session.sessionToken;
}

/** Token source for the API client: a missing or expired session is a 401 (back to sign-in). */
export function bearerTokenSource(): string {
  const token = sessionToken();
  if (token === null) {
    throw new ApiError(401, { code: 'AUTHENTICATION_REQUIRED', message: 'Your session has ended. Sign in again.' });
  }
  return token;
}
