/**
 * API runtime configuration from Vite env (see .env.example).
 *
 * Mocks are the default: only an explicit `VITE_USE_MOCKS=false` switches to
 * the real API, and only when a base URL is set. The evidence label shown
 * in the UI (MOCK / INTEGRATED) follows this value.
 */

export type ApiEvidence = 'MOCK' | 'INTEGRATED';

export interface ApiConfig {
  useMocks: boolean;
  baseUrl: string;
}

export function readApiConfig(env: Record<string, unknown> = import.meta.env): ApiConfig {
  const baseUrl = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL : '';
  const useMocks = env.VITE_USE_MOCKS !== 'false' || baseUrl === '';
  return { useMocks, baseUrl };
}

export function evidenceOf(config: ApiConfig): ApiEvidence {
  return config.useMocks ? 'MOCK' : 'INTEGRATED';
}

/**
 * Google OAuth client ID for Google Identity Services (public, not a secret;
 * Q-B28). Anything that is not a client ID (missing, or the `.env.example`
 * placeholder) means "not configured": the sign-in button shows BLOCKED.
 */
export function readGoogleClientId(env: Record<string, unknown> = import.meta.env): string | null {
  const value = typeof env.VITE_GOOGLE_CLIENT_ID === 'string' ? env.VITE_GOOGLE_CLIENT_ID.trim() : '';
  return /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(value) ? value : null;
}
