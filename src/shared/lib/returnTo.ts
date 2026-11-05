/**
 * Where to land after signing in again (A37).
 *
 * The preference ("last" page or "home") is a per-browser setting in
 * localStorage. The saved page is only a path (pathname + search) with the
 * id of the user who was signed in, in sessionStorage; no token or other
 * session data is ever stored here. Every storage access is guarded because
 * it can throw (private windows, blocked site data).
 */

import { ROUTES } from '@/app/routes';

export type AfterSignIn = 'last' | 'home';

const PREFERENCE_KEY = 'newcp-after-sign-in';
const RETURN_KEY = 'newcp-return-to';

export const DEFAULT_AFTER_SIGN_IN: AfterSignIn = 'last';

export function readAfterSignIn(): AfterSignIn {
  try {
    return localStorage.getItem(PREFERENCE_KEY) === 'home' ? 'home' : DEFAULT_AFTER_SIGN_IN;
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
}

export function writeAfterSignIn(value: AfterSignIn): void {
  try {
    localStorage.setItem(PREFERENCE_KEY, value);
  } catch {
    // The choice then lasts only until the page is reloaded.
  }
}

/** Same-origin in-app paths only, never the sign-in page itself. */
export function isSafeReturnPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return false;
  return path !== ROUTES.login && !path.startsWith(`${ROUTES.login}?`) && !path.startsWith(`${ROUTES.login}/`);
}

export interface SavedReturn {
  path: string;
  userUuid: string;
}

export function saveReturnTo(path: string, userUuid: string): void {
  if (!isSafeReturnPath(path)) return;
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({ path, userUuid } satisfies SavedReturn));
  } catch {
    // Without storage the user simply lands on Home.
  }
}

export function readReturnTo(): SavedReturn | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { path, userUuid } = value as Record<string, unknown>;
    return typeof path === 'string' && typeof userUuid === 'string' && isSafeReturnPath(path)
      ? { path, userUuid }
      : null;
  } catch {
    return null;
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}
