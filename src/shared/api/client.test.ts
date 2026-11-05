import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './apiError';
import { createNewCpClient } from './client';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function setup(response: Response | Error) {
  const fetchImpl = vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  const client = createNewCpClient('https://api.example.test/', () => 'test-token', fetchImpl);
  return { client, fetchImpl };
}

function requestOf(fetchImpl: ReturnType<typeof setup>['fetchImpl']) {
  const call = fetchImpl.mock.calls.at(0);
  if (!call) throw new Error('fetch was not called');
  const [input, init = {}] = call;
  const url = input instanceof Request ? input.url : input.toString();
  const body = typeof init.body === 'string' ? init.body : '';
  return { url, init, body, headers: new Headers(init.headers) };
}

describe('createNewCpClient', () => {
  it('calls the contract path with the bearer token and JSON accept header', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, []));
    await client.orderItems('order/1');
    const { url, headers } = requestOf(fetchImpl);
    expect(url).toBe('https://api.example.test/api/v1/orders/order%2F1/services');
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('sends the Idempotency-Key and a JSON body on create', async () => {
    const { client, fetchImpl } = setup(jsonResponse(201, { uuid: 'u' }));
    await client.create('o', { sellableItemUuid: 's', answers: [] }, 'key-1');
    const { init, body, headers } = requestOf(fetchImpl);
    expect(init.method).toBe('POST');
    expect(headers.get('Idempotency-Key')).toBe('key-1');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(JSON.parse(body)).toEqual({ sellableItemUuid: 's', answers: [] });
  });

  it('sends a transition with If-Match, including hold details, and returns the new ETag', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, {}, { ETag: '"rev-3"' }));
    const result = await client.transition(
      'i',
      { transitionId: 7, holdType: 'customer', holdReasonCode: 'R' },
      '"rev-2"',
    );
    const { url, body, headers } = requestOf(fetchImpl);
    expect(url).toBe('https://api.example.test/api/v1/services/i/transitions');
    expect(headers.get('If-Match')).toBe('"rev-2"');
    expect(JSON.parse(body)).toEqual({ transitionId: 7, holdType: 'customer', holdReasonCode: 'R' });
    expect(result.etag).toBe('"rev-3"');
  });

  it('rejects with ApiError carrying the Problem body', async () => {
    const { client } = setup(jsonResponse(422, { code: 'invalid', message: 'Pick a format.' }));
    const error: unknown = await client.item('i').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, kind: 'validation', message: 'Pick a format.' });
  });

  it('rejects with a network ApiError when fetch fails', async () => {
    const { client } = setup(new TypeError('Failed to fetch'));
    await expect(client.item('i')).rejects.toMatchObject({ kind: 'network', status: 0 });
  });
});

describe('createNewCpClient: reference contract v0.9.2', () => {
  it('reads hold reasons for one hold type', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, []));
    await client.holdReasons('internal');
    expect(requestOf(fetchImpl).url).toBe('https://api.example.test/api/v1/catalog/hold-reasons?holdType=internal');
  });

  it('returns an item with its ETag header, falling back to the body copy', async () => {
    const header = setup(jsonResponse(200, { uuid: 'i' }, { ETag: '"rev-1"' }));
    expect(await header.client.item('i')).toEqual({ data: { uuid: 'i' }, etag: '"rev-1"' });
    const body = setup(jsonResponse(200, { uuid: 'i', etag: '"rev-9"' }));
    expect((await body.client.item('i')).etag).toBe('"rev-9"');
  });

  it('fails clearly when the server sends no version at all', async () => {
    const { client } = setup(jsonResponse(200, { uuid: 'i' }));
    await expect(client.item('i')).rejects.toMatchObject({ kind: 'server' });
  });

  it('sends PATCH with If-Match and refuses to send without one', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, { uuid: 'i' }, { ETag: '"rev-2"' }));
    const saved = await client.edit('i', { unitPrice: '18.00' }, '"rev-1"');
    expect(requestOf(fetchImpl).headers.get('If-Match')).toBe('"rev-1"');
    expect(saved.etag).toBe('"rev-2"');
    await expect(client.edit('i', { unitPrice: '18.00' }, '')).rejects.toMatchObject({ kind: 'preconditionRequired' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('maps 412 to stale and 428 to preconditionRequired', async () => {
    const stale = setup(jsonResponse(412, { code: 'stale', message: 'Changed.' }));
    await expect(stale.client.edit('i', { isBillable: false }, '"rev-1"')).rejects.toMatchObject({ kind: 'stale' });
    const missing = setup(jsonResponse(428, null));
    await expect(missing.client.transition('i', { transitionId: 1 }, '"x"')).rejects.toMatchObject({
      kind: 'preconditionRequired',
    });
  });
});
