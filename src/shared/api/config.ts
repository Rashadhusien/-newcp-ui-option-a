/**
 * API runtime configuration from Vite env (see .env.example).
 *
 * A38: every operation in the canonical contract always calls the real API
 * (`VITE_API_BASE_URL`; empty = same origin through the Vite /api proxy).
 * `VITE_USE_MOCKS` now only decides what the screens WITHOUT an endpoint
 * show (orders list, create order): synthetic data labelled MOCK (the
 * default), or BLOCKED with `VITE_USE_MOCKS=false`.
 */

export type ApiEvidence = 'MOCK' | 'INTEGRATED' | 'BLOCKED';

export interface ApiConfig {
  useMocks: boolean;
  baseUrl: string;
}

export function readApiConfig(env: Record<string, unknown> = import.meta.env): ApiConfig {
  const baseUrl = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL : '';
  const useMocks = env.VITE_USE_MOCKS !== 'false';
  return { useMocks, baseUrl };
}

/** Label for a screen whose operation is not in the contract: synthetic (MOCK) or unavailable (BLOCKED). */
export function evidenceOf(config: ApiConfig): Exclude<ApiEvidence, 'INTEGRATED'> {
  return config.useMocks ? 'MOCK' : 'BLOCKED';
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
