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

  it('has no zero-charge reasons source with the real API (Q-B17)', async () => {
    await expect(createServiceApi(REAL, () => 'token').zeroChargeReasons()).rejects.toMatchObject({ kind: 'blocked' });
  });
});
