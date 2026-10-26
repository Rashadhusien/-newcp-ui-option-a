import { describe, expect, it } from 'vitest';
import { ApiError, asProblem, kindFromStatus } from './apiError';

describe('kindFromStatus', () => {
  it.each([
    [400, 'badRequest'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [422, 'validation'],
    [500, 'server'],
    [503, 'server'],
    [418, 'badRequest'],
  ] as const)('maps %i to %s', (status, kind) => {
    expect(kindFromStatus(status)).toBe(kind);
  });
});

describe('asProblem', () => {
  it('keeps the contract Problem fields', () => {
    expect(
      asProblem({ code: 'x', message: 'Bad', requestId: 'r1', details: { field: 'a' }, extra: 1 }),
    ).toEqual({ code: 'x', message: 'Bad', requestId: 'r1', details: { field: 'a' } });
  });

  it('returns null for anything that is not a Problem', () => {
    expect(asProblem(null)).toBeNull();
    expect(asProblem('oops')).toBeNull();
    expect(asProblem({ code: 1, message: 'm' })).toBeNull();
    expect(asProblem({ code: 'c' })).toBeNull();
  });

  it('drops non-object details', () => {
    expect(asProblem({ code: 'c', message: 'm', details: ['a'] })).toEqual({ code: 'c', message: 'm' });
  });
});

describe('ApiError', () => {
  it('uses the server message when there is one', () => {
    const error = new ApiError(409, { code: 'c', message: 'Locked by another user.' });
    expect(error.kind).toBe('conflict');
    expect(error.message).toBe('Locked by another user.');
  });

  it('falls back to a message per kind', () => {
    expect(new ApiError(403, null).message).toBe('You do not have permission to do this.');
    expect(ApiError.network().kind).toBe('network');
    expect(ApiError.network().status).toBe(0);
  });
});

describe('IAM error envelope and codes (v0.9.7, D-52)', () => {
  it('reads the IAM envelope as well as the flat Problem', () => {
    expect(
      asProblem({ error: { code: 'PERMISSION_DENIED', message: 'No access', requestId: 'req-1', details: {} } }),
    ).toEqual({ code: 'PERMISSION_DENIED', message: 'No access', requestId: 'req-1', details: {} });
  });

  it.each(['ACCESS_NOT_ASSIGNED', 'TENANT_NOT_ASSIGNED'])('maps 403 %s to Pending Access', (code) => {
    const error = new ApiError(403, { code, message: 'Pending' });
    expect(error.kind).toBe('accessNotAssigned');
    expect(error.code).toBe(code);
  });

  it('keeps other 403 codes as forbidden', () => {
    expect(new ApiError(403, { code: 'PERMISSION_DENIED', message: 'm' }).kind).toBe('forbidden');
    expect(new ApiError(403, { code: 'TENANT_ACCESS_DENIED', message: 'm' }).kind).toBe('forbidden');
    expect(new ApiError(403, null).kind).toBe('forbidden');
  });

  it('never maps a Pending code on another status', () => {
    expect(kindFromStatus(401, 'ACCESS_NOT_ASSIGNED')).toBe('unauthorized');
  });
});
