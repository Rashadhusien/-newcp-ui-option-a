import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServiceApi } from './serviceApi';

const REAL = { useMocks: false, baseUrl: 'https://api.example.test' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('service adapter: Bill To with the real API (D-44, F07 absent)', () => {
  it('labels the real adapter INTEGRATED but Bill To unavailable', () => {
    const api = createServiceApi(REAL, () => 'token');
    expect(api).toMatchObject({ evidence: 'INTEGRATED', billToAvailable: false, demoOrderUuid: null });
    expect(createServiceApi({ useMocks: true, baseUrl: '' })).toMatchObject({ evidence: 'MOCK', billToAvailable: true });
  });

  it('never calls the payer endpoint', async () => {
    const fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
    const api = createServiceApi(REAL, () => 'token');
    await expect(api.eligibleBilledParties('o')).rejects.toMatchObject({ kind: 'blocked' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never sends billedToContactUuid on create or edit', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('{}', { status: 200, headers: { ETag: '"rev-2"' } })),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const api = createServiceApi(REAL, () => 'token');
    await api.create('o', { sellableItemUuid: 's', answers: [], billedToContactUuid: 'payer' });
    await api.edit('i', { isBillable: false, billedToContactUuid: 'payer' }, '"rev-1"');
    const bodies = fetchSpy.mock.calls.map(([, init]) => (typeof init?.body === 'string' ? init.body : ''));
    expect(bodies).toHaveLength(2);
    for (const body of bodies) expect(body).not.toContain('billedToContactUuid');
    expect(JSON.parse(bodies[1] ?? '{}')).toEqual({ isBillable: false });
  });

  it('reads zero-charge reasons from the lookup endpoint with the real API (Q-B17, D-79)', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() => Promise.resolve(new Response('[]', { status: 200 })));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(createServiceApi(REAL, () => 'token').zeroChargeReasons()).resolves.toEqual([]);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://api.example.test/api/v1/lookups/zero-charge-reasons');
  });
});

describe('service adapter: never sends a tenant (IAM v0.9.7, TEN-05/06/28)', () => {
  it('puts no tenant in any header, query or body', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('{}', { status: 200, headers: { ETag: '"rev-2"' } })),
    );
    vi.stubGlobal('fetch', fetchSpy);
    const api = createServiceApi(REAL, () => 'token');
    await api.orderItems('o');
    await api.create('o', { sellableItemUuid: 's', answers: [] });
    await api.edit('i', { unitPrice: '18.00' }, '"rev-1"');
    await api.transition('i', { transitionId: 1, holdType: 'internal', holdReasonCode: 'R' }, '"rev-1"');
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    for (const [input, init] of fetchSpy.mock.calls) {
      const url = input instanceof Request ? input.url : input.toString();
      const headers = new Headers(init?.headers);
      const body = typeof init?.body === 'string' ? init.body : '';
      expect(url.toLowerCase()).not.toContain('tenant');
      expect(body.toLowerCase()).not.toContain('tenant');
      expect([...headers.keys()].some((name) => name.includes('tenant'))).toBe(false);
    }
  });
});
