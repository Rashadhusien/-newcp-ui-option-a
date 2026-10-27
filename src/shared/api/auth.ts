/**
 * New CP sign-in (A25, backend team request, D-67): the Google ID token
 * from Google Identity Services goes to `POST /api/v1/auth/login` once, and
 * the backend answers with the New CP session token and its expiry. Every
 * later request sends `Authorization: Bearer <session-token>`.
 *
 * The endpoint is not in the reference OpenAPI yet (Q-B27): the response
 * field names below (`sessionToken`, `expiresAt`) are `[NEEDS VERIFICATION]`
 * and live only in `asLoginResult`, so a change stays local.
 *
 * The session token is kept in memory only (CLAUDE.md: no token storage), so
 * a page reload signs in again until the backend says otherwise (Q-B29). The
 * Google ID token is sent to this endpoint only and never kept.
 */

import { ApiError, asProblem } from './apiError';

export interface LoginResult {
  sessionToken: string;
  /** ISO date-time; null when the response gave no usable expiry. */
  expiresAt: string | null;
}

/** [NEEDS VERIFICATION] response shape (Q-B27). */
export function asLoginResult(body: unknown): LoginResult | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.sessionToken !== 'string' || record.sessionToken === '') return null;
  const expiresAt =
    typeof record.expiresAt === 'string' && !Number.isNaN(Date.parse(record.expiresAt)) ? record.expiresAt : null;
  return { sessionToken: record.sessionToken, expiresAt };
}

export async function loginWithGoogleIdToken(
  baseUrl: string,
  idToken: string,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw ApiError.network();
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, asProblem(body));
  const result = asLoginResult(body);
  if (!result) {
    throw new ApiError(
      0,
      { code: 'client.login_response', message: 'The server answered the sign-in without a session token.' },
      'server',
    );
  }
  return result;
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
