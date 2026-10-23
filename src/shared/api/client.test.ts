import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './apiError';
import { createNewCpClient } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

  it('sends a transition as { transitionId }', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, {}));
    await client.transition('i', { transitionId: 7 });
    const { url, body } = requestOf(fetchImpl);
    expect(url).toBe('https://api.example.test/api/v1/services/i/transitions');
    expect(JSON.parse(body)).toEqual({ transitionId: 7 });
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
