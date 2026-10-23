/**
 * ApiError: the one error type every API call rejects with.
 *
 * `kind` comes from the HTTP status the contract documents for every
 * operation (400, 401, 403, 404, 409, 422) plus 5xx and network failures.
 * `problem` is the contract's Problem body when the server sent one; its
 * `code` values are not enumerated yet (Q-B7), so the UI never branches on
 * them and shows `problem.message` when present.
 */

import type { Problem } from './types';

export type ApiErrorKind =
  | 'badRequest'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'network';

export function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'badRequest';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    default:
      return status >= 500 ? 'server' : 'badRequest';
  }
}

/** Narrows an unknown response body to the contract's Problem shape. */
export function asProblem(body: unknown): Problem | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.code !== 'string' || typeof record.message !== 'string') return null;
  const problem: Problem = { code: record.code, message: record.message };
  if (typeof record.requestId === 'string') problem.requestId = record.requestId;
  if (typeof record.details === 'object' && record.details !== null && !Array.isArray(record.details)) {
    problem.details = record.details as Record<string, unknown>;
  }
  return problem;
}

/** Fallback text per kind, used when the server sent no Problem message. */
const DEFAULT_MESSAGE: Record<ApiErrorKind, string> = {
  badRequest: 'The request was not accepted. Check the values and try again.',
  unauthorized: 'Your session has ended. Sign in again.',
  forbidden: 'You do not have permission to do this.',
  notFound: 'This record was not found, or you do not have access to it.',
  conflict: 'This record changed or is locked. Reload it and try again.',
  validation: 'Some values are not valid. Correct them and try again.',
  server: 'The server had a problem. Try again in a moment.',
  network: 'The server could not be reached. Check the connection and try again.',
};

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly problem: Problem | null;

  /** status 0 = no HTTP response (network failure). */
  constructor(status: number, problem: Problem | null, kind: ApiErrorKind = kindFromStatus(status)) {
    super(problem?.message ?? DEFAULT_MESSAGE[kind]);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.problem = problem;
  }

  static network(): ApiError {
    return new ApiError(0, null, 'network');
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
