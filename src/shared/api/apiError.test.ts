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
