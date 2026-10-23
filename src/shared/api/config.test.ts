import { describe, expect, it } from 'vitest';
import { evidenceOf, readApiConfig } from './config';

describe('readApiConfig', () => {
  it('defaults to mocks', () => {
    expect(readApiConfig({})).toEqual({ useMocks: true, baseUrl: '' });
  });

  it('uses the real API only when mocks are off AND a base URL is set', () => {
    expect(readApiConfig({ VITE_USE_MOCKS: 'false', VITE_API_BASE_URL: 'https://api.example.test' }))
      .toEqual({ useMocks: false, baseUrl: 'https://api.example.test' });
    expect(readApiConfig({ VITE_USE_MOCKS: 'false' }).useMocks).toBe(true);
  });

  it('labels the evidence', () => {
    expect(evidenceOf({ useMocks: true, baseUrl: '' })).toBe('MOCK');
    expect(evidenceOf({ useMocks: false, baseUrl: 'x' })).toBe('INTEGRATED');
  });
});
