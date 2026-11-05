import { describe, expect, it } from 'vitest';
import { evidenceOf, readApiConfig } from './config';

describe('readApiConfig', () => {
  it('defaults to synthetic data for the screens without an endpoint', () => {
    expect(readApiConfig({})).toEqual({ useMocks: true, baseUrl: '' });
  });

  it('turns them off with VITE_USE_MOCKS=false, whatever the base URL (A38)', () => {
    expect(readApiConfig({ VITE_USE_MOCKS: 'false', VITE_API_BASE_URL: 'https://api.example.test' }))
      .toEqual({ useMocks: false, baseUrl: 'https://api.example.test' });
    expect(readApiConfig({ VITE_USE_MOCKS: 'false' }).useMocks).toBe(false);
  });

  it('labels the screens without an endpoint MOCK or BLOCKED', () => {
    expect(evidenceOf({ useMocks: true, baseUrl: '' })).toBe('MOCK');
    expect(evidenceOf({ useMocks: false, baseUrl: 'x' })).toBe('BLOCKED');
  });
});
