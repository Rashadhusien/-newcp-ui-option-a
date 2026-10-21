/**
 * Mock session placeholder until Google login (A4).
 *
 * The signed-in flag lives in localStorage; storage access is guarded
 * because private windows or blocked site data can throw, which must read
 * as "signed out" rather than crash the app.
 */

const AUTH_KEY = 'newcp-auth';

export interface SessionUser {
  name: string;
  email: string;
}

// Invented demo identity; never a real person.
const MOCK_USER: SessionUser = { name: 'Demo User', email: 'demo.user@example.test' };

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getCurrentUser(): SessionUser | null {
  return isAuthenticated() ? MOCK_USER : null;
}

export function signIn(): void {
  try {
    localStorage.setItem(AUTH_KEY, 'true');
  } catch {
    // Session still proceeds for this page load.
  }
}

export function signOut(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // Nothing persisted to clear.
  }
}
