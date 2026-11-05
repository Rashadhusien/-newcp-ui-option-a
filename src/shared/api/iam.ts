/**
 * IAM administration client: list users, list roles, assign a role.
 *
 * Paths and bodies follow the canonical contract. The tenant is resolved by
 * the server from the session; nothing here sends or chooses one.
 */

import { ApiError, asProblem } from './apiError';
import type { TokenSource, RequestOptions } from './client';
import type { IamRoleAssignmentResponse, IamRoleSummary, IamUserSummary } from './types';

export interface IamClient {
  users(options?: RequestOptions): Promise<IamUserSummary[]>;
  roles(options?: RequestOptions): Promise<IamRoleSummary[]>;
  assignRole(userId: number, roleId: number, options?: RequestOptions): Promise<IamRoleAssignmentResponse>;
}

export function createIamClient(
  baseUrl: string,
  tokenSource: TokenSource,
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): IamClient {
  const root = baseUrl.replace(/\/$/, '');

  async function invoke<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await tokenSource();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    if (init.body != null) headers.set('Content-Type', 'application/json');
    let response: Response;
    try {
      response = await fetchImpl(root + path, { ...init, headers });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw ApiError.network();
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, asProblem(body));
    return body as T;
  }

  return {
    users: (options) => invoke('/api/v1/iam/users', { signal: options?.signal }),
    roles: (options) => invoke('/api/v1/iam/roles', { signal: options?.signal }),
    assignRole: (userId, roleId, options) =>
      invoke(`/api/v1/iam/users/${encodeURIComponent(String(userId))}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleId }),
        signal: options?.signal,
      }),
  };
}
