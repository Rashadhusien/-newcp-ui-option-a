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
