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
import { MOCK_ORDER_UUID } from '@/mocks/serviceFixtures';
import { createMockServiceApi } from './mockServiceApi';

export interface ServiceApi extends NewCpClient {
  readonly evidence: ApiEvidence;
  /**
   * The order the demo works on. The contract has no order lookup yet
   * (Q-B3), so only the mock can name one; null with the real API.
   */
  readonly demoOrderUuid: string | null;
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
    return {
      ...createMockServiceApi({ failWith: failStatusFromUrl() }),
      evidence: 'MOCK',
      demoOrderUuid: MOCK_ORDER_UUID,
    };
  }
  return { ...createNewCpClient(config.baseUrl, tokenSource), evidence: 'INTEGRATED', demoOrderUuid: null };
}

/** App-wide instance. */
export const serviceApi: ServiceApi = createServiceApi();
