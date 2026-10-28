/**
 * IAM data adapter: mock or real client behind one interface, chosen by
 * `VITE_USE_MOCKS`. Every rejection is reported to the session (401 returns
 * to sign-in, 403 refreshes the context) and rethrown unchanged. No tenant
 * is ever sent.
 */

import {
  bearerTokenSource,
  createIamClient,
  evidenceOf,
  readApiConfig,
  type ApiConfig,
  type ApiEvidence,
  type IamClient,
} from '@/shared/api';
import { reportAccessError } from '@/shared/lib/session';
import { createMockIamApi } from './mockIamApi';

export interface IamApi extends IamClient {
  readonly evidence: ApiEvidence;
}

async function reporting<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    reportAccessError(error);
    throw error;
  }
}

export function createIamApi(config: ApiConfig = readApiConfig()): IamApi {
  const client = config.useMocks ? createMockIamApi() : createIamClient(config.baseUrl, bearerTokenSource);
  return {
    users: (options) => reporting(() => client.users(options)),
    roles: (options) => reporting(() => client.roles(options)),
    assignRole: (userId, roleId, options) => reporting(() => client.assignRole(userId, roleId, options)),
    evidence: evidenceOf(config),
  };
}

export const iamApi: IamApi = createIamApi();
