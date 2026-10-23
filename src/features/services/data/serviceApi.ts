/**
 * Service-instance data adapter: the one entry point the services feature
 * uses for API data. Mock and real implementations share one interface
 * (the contract client's), plus the evidence label the UI must show.
 *
 * Mock is the default (`VITE_USE_MOCKS`, see shared/api/config). For manual
 * checks the mock reads `?fail=<status>` from the page URL and fails every
 * call with that status (400, 401, 403, 404, 409, 422, 500, or 0 for a
 * network failure).
 */

import {
  ApiError,
  createNewCpClient,
  readApiConfig,
  type ApiConfig,
  type ApiEvidence,
  type NewCpClient,
  type TokenSource,
} from '@/shared/api';
import { createMockServiceApi } from './mockServiceApi';

export interface ServiceApi extends NewCpClient {
  readonly evidence: ApiEvidence;
}

/** Until the auth adapter exists (A4), the real API has no token to send. */
const noSessionToken: TokenSource = () => {
  throw new ApiError(401, null);
};

function failStatusFromUrl(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = new URLSearchParams(window.location.search).get('fail');
  if (value == null) return undefined;
  const status = Number.parseInt(value, 10);
  return Number.isInteger(status) ? status : undefined;
}

export function createServiceApi(
  config: ApiConfig = readApiConfig(),
  tokenSource: TokenSource = noSessionToken,
): ServiceApi {
  if (config.useMocks) {
    return { ...createMockServiceApi({ failWith: failStatusFromUrl() }), evidence: 'MOCK' };
  }
  return { ...createNewCpClient(config.baseUrl, tokenSource), evidence: 'INTEGRATED' };
}

/** App-wide instance. */
export const serviceApi: ServiceApi = createServiceApi();
